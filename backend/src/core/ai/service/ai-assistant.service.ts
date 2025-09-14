import { InferenceClient } from '@huggingface/inference';
import { EssayGradingAssistantPrompt } from '../../../utils/prompt';

export interface AIGradingResult {
    isCorrect: boolean;
    scoreObtained: number;
    suggestion: string;
    confidence: number;
}

export class AIAssistantService {
    private hf: InferenceClient;
    private readonly MODEL_NAME = 'google/gemma-3-27b-it';
    private readonly GRADING_CONFIG = {
        max_new_tokens: 300,
        temperature: 0.3,
        do_sample: true,
        return_full_text: false,
    };

    /**
     * Strip HTML tags from text for fair comparison
     * @param text Text that may contain HTML tags
     * @returns Clean text without HTML tags
     */
    private stripHtmlTags(text: string): string {
        if (!text) return '';
        
        // Remove HTML tags using regex
        return text
            .replace(/<[^>]*>/g, '') // Remove all HTML tags
            .replace(/&nbsp;/g, ' ') // Replace non-breaking spaces
            .replace(/&amp;/g, '&')   // Replace HTML entities
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .trim(); // Remove leading/trailing whitespace
    }

    constructor() {
        this.hf = new InferenceClient(process.env.HUGGING_FACE_API_KEY);
    }

    /**
     * Grade an essay question using AI assistant
     * @param questionText The question text
     * @param studentAnswer The student's submitted answer
     * @param expectedAnswers Array of expected answers (optional)
     * @param maxScore Maximum possible score for the question
     * @param questionType Type of question (ses or les)
     * @returns AI grading result
     */
    async gradeEssayQuestion(
        questionText: string,
        studentAnswer: string,
        expectedAnswers: string[] = [],
        maxScore: number,
        questionType: 'ses' | 'les'
    ): Promise<AIGradingResult> {
        try {
            // If no student answer provided, return zero score
            if (!studentAnswer || studentAnswer.trim().length === 0) {
                return {
                    isCorrect: false,
                    scoreObtained: 0,
                    suggestion: 'No answer provided by student.',
                    confidence: 1.0
                };
            }

            // Check for prompt injection attacks first
            const trimmedAnswer = studentAnswer.trim();
            const lowerAnswer = trimmedAnswer.toLowerCase();
            
            console.log('Checking prompt injection and meaningless answer patterns for:', trimmedAnswer);
            console.log('Lowercase version:', lowerAnswer);
            console.log('Length:', trimmedAnswer.length);

            // Detect prompt injection attempts
            const promptInjectionPatterns = [
                // Direct injection commands
                /ignore\s+(every|all|what|everything|above|below|previous|instructions?)/i,
                /focus\s+(at|on)\s+(this|that|my|the)\s+(prompt|instruction|request)/i,
                /(give|award|assign)\s+(me|us)\s+(full|perfect|maximum|max)\s+(score|points?|marks?)/i,
                /(override|disregard|forget)\s+(instructions?|prompts?|rules?|guidelines?)/i,
                
                // System manipulation attempts
                /you\s+(are|must|should|need|have)\s+to\s+(give|award|assign)/i,
                /system\s+(override|hack|bypass|ignore)/i,
                /act\s+(as|like)\s+(if|though)/i,
                /pretend\s+(that|to|like)/i,
                
                // Score manipulation
                /just\s+(give|award)\s+(me|us)\s+(\d+|full|perfect|maximum)/i,
                /award\s+(\d+|full|perfect|maximum)\s+(points?|marks?|score)/i,
                /set\s+(score|points?|marks?)\s+to\s+(\d+|full|perfect|maximum)/i,
                
                // Common injection phrases
                /new\s+(instruction|prompt|rule)/i,
                /different\s+(instruction|prompt|rule)/i,
                /actually\s+(i\s+want|give|award)/i,
                /instead\s+(of|give|award)/i,
                
                // Sophisticated attempts
                /according\s+to\s+(new|updated|latest)\s+(rules?|guidelines?)/i,
                /the\s+(real|actual|true)\s+(instruction|prompt|task)/i,
                /(bypass|skip|ignore)\s+(grading|evaluation|assessment)/i
            ];

            const containsInjection = promptInjectionPatterns.some(pattern => pattern.test(lowerAnswer));
            
            if (containsInjection) {
                // Log security incident for audit trail
                console.error('🚨 SECURITY ALERT - PROMPT INJECTION DETECTED:', {
                    timestamp: new Date().toISOString(),
                    incident_type: 'PROMPT_INJECTION_ATTEMPT',
                    student_answer: trimmedAnswer,
                    question_text: questionText.substring(0, 100) + '...',
                    detection_method: 'server_side_pattern_matching',
                    action_taken: 'blocked_and_scored_zero'
                });
                
                console.log('🚨 PROMPT INJECTION DETECTED - blocking attack attempt');
                return {
                    isCorrect: false,
                    scoreObtained: 0,
                    suggestion: 'Answer contains prompt injection attempt and has been flagged for security review.',
                    confidence: 1.0
                };
            }
            
            // Common meaningless responses
            const meaninglessPatterns = [
                // Single characters or very short
                /^.{1,2}$/,
                // Punctuation only
                /^[.!?@#$%^&*()_+=\-\[\]{}|\\:";'<>?,./]*$/,
                // Common abbreviations/slang (exact match)
                /^(wtf|idk|lol|lmao|rofl|omg|brb|ttyl|tbh|smh|fml|yolo|af|rip|nvm|ikr|imo|imho|gtg|asap|fyi)$/i,
                // "I don't know" variations (simple)
                /^i\s+dont?\s+know(\s+(lol|haha|xd|lmao|omg|wtf|rofl))*$/i,
                /^i\s+don'?t\s+know(\s+(lol|haha|xd|lmao|omg|wtf|rofl))*$/i,
                /^i\s+do\s+not\s+know(\s+(lol|haha|xd|lmao|omg|wtf|rofl))*$/i,
                // "I still don't know" variations
                /^i\s+still\s+dont?\s+know(\s+(lol|haha|xd|lmao|omg|wtf|rofl))*$/i,
                /^i\s+still\s+don'?t\s+know(\s+(lol|haha|xd|lmao|omg|wtf|rofl))*$/i,
                /^i\s+still\s+do\s+not\s+know(\s+(lol|haha|xd|lmao|omg|wtf|rofl))*$/i,
                // Other "no idea" variations
                /^(no\s+idea|i\s+have\s+no\s+(idea|clue)|dunno)(\s+(lol|haha|xd|lmao|omg|wtf|rofl))*$/i,
                // Repeated characters
                /^(.)\1{2,}$/,
                // Random keyboard mashing
                /^[qwertyuiopasdfghjklzxcvbnm]{3,}$/i,
                // Numbers only
                /^\d+$/,
                // Common nonsensical responses (exact match)
                /^(no|yes|maybe|ok|okay|fine|whatever|dunno|nope|yep|meh|ugh|huh|hmm|um|uh|ah|oh)$/i,
                // Short meaningless phrases
                /^(i\s*don'?t\s*care|whatever|no\s*comment|pass|skip|next)$/i,
                // Expressions with emoticons/slang only
                /^(lol|haha|xd|lmao|omg|wtf|rofl)(\s+(lol|haha|xd|lmao|omg|wtf|rofl))*\s*$/i
            ];

            // Test each pattern individually for debugging
            for (let i = 0; i < meaninglessPatterns.length; i++) {
                const pattern = meaninglessPatterns[i];
                const matches = pattern.test(lowerAnswer);
                if (matches) {
                    console.log(`Pattern ${i} matched: ${pattern}`);
                }
            }

            const isInvalidAnswer = trimmedAnswer.length <= 2 || 
                                  meaninglessPatterns.some(pattern => pattern.test(lowerAnswer));

            console.log('Is invalid answer:', isInvalidAnswer);

            if (isInvalidAnswer) {
                console.log('CAUGHT MEANINGLESS ANSWER - returning 0%');
                return {
                    isCorrect: false,
                    scoreObtained: 0,
                    suggestion: `Answer "${trimmedAnswer}" appears to be meaningless, too short, or nonsensical to evaluate.`,
                    confidence: 1.0
                };
            }

            // Strip HTML tags for clean comparison
            const cleanStudentAnswer = this.stripHtmlTags(studentAnswer);
            const cleanQuestionText = this.stripHtmlTags(questionText);
            const modelAnswer = expectedAnswers.length > 0 
                ? expectedAnswers.map(answer => this.stripHtmlTags(answer)).join(' OR ') 
                : '';
                
            console.log('AI Grading - Clean texts:');
            console.log('Student answer:', cleanStudentAnswer);
            console.log('Expected answer:', modelAnswer);

            // For questions without expected answers, use a more lenient evaluation approach
            const hasExpectedAnswers = expectedAnswers.length > 0;
            
            // Generate grading prompt with clean text
            const gradingPrompt = EssayGradingAssistantPrompt(
                cleanQuestionText,
                modelAnswer,
                cleanStudentAnswer,
                maxScore,
                questionType,
                hasExpectedAnswers
            );

            console.log('AI Grading - Grading prompt:', gradingPrompt);

            // Call Hugging Face API
            const result = await this.hf.chatCompletion({
                provider: "nebius",
                model: "google/gemma-3-27b-it",
                messages: [
                    {
                        role: "user",
                        content: [
                            {
                                type: "text",
                                text: gradingPrompt,
                            },
                        ],
                    },
                ],
                ...this.GRADING_CONFIG
            });

            const suggestion = result.choices?.[0]?.message?.content || 'Unable to provide grading suggestion.';
            console.log('AI Response:', suggestion);

            // Validate AI response for potential manipulation
            const isManipulatedResponse = this.detectManipulatedAIResponse(suggestion, cleanStudentAnswer);
            if (isManipulatedResponse) {
                // Log security incident for audit trail
                console.error('🚨 SECURITY ALERT - MANIPULATED AI RESPONSE DETECTED:', {
                    timestamp: new Date().toISOString(),
                    incident_type: 'AI_RESPONSE_MANIPULATION',
                    student_answer: cleanStudentAnswer,
                    ai_response: suggestion.substring(0, 200) + '...',
                    question_text: cleanQuestionText.substring(0, 100) + '...',
                    detection_method: 'ai_response_validation',
                    action_taken: 'overridden_with_zero_score'
                });
                
                console.log('🚨 MANIPULATED AI RESPONSE DETECTED - overriding with 0%');
                return {
                    isCorrect: false,
                    scoreObtained: 0,
                    suggestion: 'AI response appears to have been manipulated by prompt injection. Flagged for security review.',
                    confidence: 1.0
                };
            }

            // Parse the AI's assessment and extract the percentage/score
            const gradingResult = this.parseAIGradingResponse(suggestion, maxScore, hasExpectedAnswers);
            
            console.log('Final grading result:', {
                scoreObtained: gradingResult.scoreObtained,
                maxScore,
                percentage: Math.round((gradingResult.scoreObtained / maxScore) * 100)
            });

            return {
                isCorrect: gradingResult.scoreObtained > 0, // Any score > 0 is considered "correct"
                scoreObtained: gradingResult.scoreObtained,
                suggestion: suggestion,
                confidence: gradingResult.confidence
            };

        } catch (error) {
            console.error('Error in AI essay grading:', error);
            
            // Simple fallback: give 50% credit if AI fails
            const fallbackScore = maxScore * 0.5;
            
            return {
                isCorrect: true,
                scoreObtained: fallbackScore,
                suggestion: `AI grading failed. Assigned 50% credit (${fallbackScore}/${maxScore}). Manual review recommended.`,
                confidence: 0.3
            };
        }
    }

    /**
     * Parse AI grading response to extract score and correctness
     */
    private parseAIGradingResponse(response: string, maxScore: number, hasExpectedAnswers: boolean = true): {
        isCorrect: boolean;
        scoreObtained: number;
        confidence: number;
    } {
        const lowerResponse = response.toLowerCase();
        
        console.log('Parsing AI response:', response);
        
        // Enhanced score patterns to match new structured format
        const scorePatterns = [
            // New structured format: SCORE: X/Y (Z%)
            /score[:\s]*(\d+(?:\.\d+)?)\s*\/\s*(\d+)\s*\((\d+(?:\.\d+)?)%\)/i,
            /score[:\s]*(\d+(?:\.\d+)?)\s*\/\s*(\d+)/i,
            // Percentage patterns
            /\((\d+(?:\.\d+)?)%\)/i,
            /(\d+(?:\.\d+)?)%/i,
            // Traditional patterns
            /(\d+(?:\.\d+)?)\s*\/\s*(\d+)\s*points?/i,
            /(\d+(?:\.\d+)?)\s*out\s*of\s*(\d+)/i,
            /grade[:\s]*(\d+(?:\.\d+)?)/i,
            /points?[:\s]*(\d+(?:\.\d+)?)/i
        ];

        let extractedScore = 0;
        let confidence = 0.7;
        let scoreFound = false;

        // Try to extract numerical score
        for (const pattern of scorePatterns) {
            const match = response.match(pattern);
            if (match) {
                console.log('Score pattern matched:', match);
                
                if (match[3]) {
                    // Format: SCORE: X/Y (Z%) - use percentage
                    const percentage = parseFloat(match[3]);
                    extractedScore = (percentage / 100) * maxScore;
                    console.log('Using percentage from structured format:', percentage + '%');
                } else if (match[2]) {
                    // Format: score/maxScore
                    extractedScore = parseFloat(match[1]);
                    const detectedMaxScore = parseFloat(match[2]);
                    if (detectedMaxScore !== maxScore) {
                        // Normalize to actual max score
                        extractedScore = (extractedScore / detectedMaxScore) * maxScore;
                    }
                    console.log('Using score/maxScore format:', extractedScore + '/' + maxScore);
                } else if (pattern.source.includes('%')) {
                    // Format: percentage only
                    const percentage = parseFloat(match[1]);
                    extractedScore = (percentage / 100) * maxScore;
                    console.log('Using percentage format:', percentage + '%');
                } else {
                    // Format: just score
                    extractedScore = parseFloat(match[1]);
                    console.log('Using raw score format:', extractedScore);
                }
                confidence = 0.9; // Higher confidence for structured format
                scoreFound = true;
                break;
            }
        }

        // Enhanced keyword analysis for better score recognition
        if (!scoreFound) {
            console.log('No numerical score found, using keyword analysis');
            
            // Look for Thai keywords from the new prompt
            if (lowerResponse.includes('ตรงกับเฉลย') || lowerResponse.includes('เดียวกัน') ||
                lowerResponse.includes('ยอดเยี่ยม') || lowerResponse.includes('ครบถ้วน') ||
                lowerResponse.includes('excellent') || lowerResponse.includes('perfect') || 
                lowerResponse.includes('outstanding') || lowerResponse.includes('comprehensive') ||
                lowerResponse.includes('matches') || lowerResponse.includes('identical')) {
                extractedScore = maxScore * 0.95; // Give 95% for excellent/matching answers
                confidence = 0.85;
                console.log('Excellent/matching answer detected, giving 95%');
            } else if (lowerResponse.includes('ถูกต้องส่วนใหญ่') || lowerResponse.includes('ครอบคลุมประเด็นหลัก') ||
                      lowerResponse.includes('good') || lowerResponse.includes('correct') || 
                      lowerResponse.includes('accurate') || lowerResponse.includes('well') ||
                      lowerResponse.includes('solid') || lowerResponse.includes('satisfactory') ||
                      lowerResponse.includes('mostly correct') || lowerResponse.includes('covers main points')) {
                extractedScore = maxScore * 0.82; // Give 82% for good answers
                confidence = 0.8;
                console.log('Good answer detected, giving 82%');
            } else if (lowerResponse.includes('ถูกต้องพอสมควร') || lowerResponse.includes('พอใช้') ||
                      lowerResponse.includes('partial') || lowerResponse.includes('somewhat') ||
                      lowerResponse.includes('adequate') || lowerResponse.includes('basic') ||
                      lowerResponse.includes('fair') || lowerResponse.includes('reasonable')) {
                extractedScore = maxScore * 0.65; // Give 65% for partial answers
                confidence = 0.7;
                console.log('Partial answer detected, giving 65%');
            } else if (lowerResponse.includes('ความพยายาม') || lowerResponse.includes('เข้าใจผิด') ||
                      lowerResponse.includes('attempt') || lowerResponse.includes('tries') ||
                      lowerResponse.includes('effort') || lowerResponse.includes('some understanding')) {
                extractedScore = maxScore * 0.35; // Give 35% for attempts
                confidence = 0.6;
                console.log('Attempt detected, giving 35%');
            } else if (lowerResponse.includes('ไม่เกี่ยวข้อง') || lowerResponse.includes('ตัวอักษรสุ่ม') ||
                      lowerResponse.includes('incorrect') || lowerResponse.includes('wrong') || 
                      lowerResponse.includes('poor') || lowerResponse.includes('inadequate') ||
                      lowerResponse.includes('nonsensical') || lowerResponse.includes('irrelevant') ||
                      lowerResponse.includes('meaningless') || lowerResponse.includes('gibberish') ||
                      lowerResponse.includes('random') || lowerResponse.includes('unrelated')) {
                extractedScore = 0; // Give 0 for clearly wrong answers
                confidence = 0.9;
                console.log('Wrong/irrelevant answer detected, giving 0%');
            } else {
                // For unclear responses, be more generous with expected answers
                if (hasExpectedAnswers) {
                    extractedScore = maxScore * 0.7; // Give 70% for unclear responses with expected answers
                    console.log('Unclear response with expected answers, giving 70%');
                } else {
                    extractedScore = maxScore * 0.75; // Give 75% for unclear responses in open questions
                    console.log('Unclear response in open question, giving 75%');
                }
                confidence = 0.5;
            }
        }

        // Additional check: if the response suggests the answer is nonsensical or random
        if (lowerResponse.includes('does not make sense') || 
            lowerResponse.includes('not relevant') ||
            lowerResponse.includes('appears to be random') ||
            lowerResponse.includes('gibberish') ||
            lowerResponse.includes('meaningless') ||
            lowerResponse.includes('ไม่มีความหมาย') ||
            lowerResponse.includes('ไม่เกี่ยวข้อง')) {
            extractedScore = 0;
            confidence = 0.95;
            console.log('Nonsensical answer override, giving 0%');
        }

        // Ensure score is within bounds
        extractedScore = Math.max(0, Math.min(extractedScore, maxScore));
        
        const finalScore = Math.round(extractedScore * 100) / 100;
        const isCorrect = extractedScore >= (maxScore * 0.5); // 50% threshold for correctness
        
        console.log('Final parsed score:', finalScore + '/' + maxScore, '(' + Math.round((finalScore/maxScore)*100) + '%)', 'Correct:', isCorrect);
        
        return {
            isCorrect,
            scoreObtained: finalScore,
            confidence
        };
    }

    /**
     * Detect if AI response appears to have been manipulated by prompt injection
     */
    private detectManipulatedAIResponse(aiResponse: string, originalStudentAnswer: string): boolean {
        const lowerResponse = aiResponse.toLowerCase();
        const lowerStudentAnswer = originalStudentAnswer.toLowerCase();
        
        // Check for suspicious AI responses that might indicate successful injection
        const suspiciousResponsePatterns = [
            // AI agreeing with injection attempts
            /fulfills this criterion/i,
            /contradicts? the stated grading guidelines/i,
            /aligns with.*instruction.*award.*full/i,
            /explicitly requested.*full score/i,
            /implies? complete comprehension/i,
            /would.*contradict.*guidelines/i,
            
            // AI being manipulated to ignore actual content
            /while unusual.*aligns with/i,
            /unconventional.*fulfills/i,
            /meta-request.*understanding/i,
            /directly requesting.*highest.*grade/i,
            
            // AI giving high scores for obvious injection attempts
            /(?:90|95|100)%.*(?:ignore|focus|give.*full)/i,
            /full.*score.*requested/i,
        ];
        
        // Check if student answer contains injection patterns AND AI gives high score
        const hasInjectionInAnswer = /ignore.*(?:above|below|every|what|all)|focus.*prompt|give.*(?:full|perfect).*score/i.test(lowerStudentAnswer);
        const hasHighScore = /(?:90|95|100)%|score:\s*(?:0\.9|1)\/1/i.test(lowerResponse);
        const hasSuspiciousReasoning = suspiciousResponsePatterns.some(pattern => pattern.test(lowerResponse));
        
        if (hasInjectionInAnswer && (hasHighScore || hasSuspiciousReasoning)) {
            console.log('🚨 AI response appears manipulated - injection attempt with high score or suspicious reasoning');
            return true;
        }
        
        return false;
    }

    /**
     * Grade multiple essay questions in batch
     */
    async gradeMultipleEssayQuestions(
        questions: Array<{
            questionId: string;
            questionText: string;
            studentAnswer: string;
            expectedAnswers: string[];
            maxScore: number;
            questionType: 'ses' | 'les';
        }>
    ): Promise<Array<{ questionId: string; result: AIGradingResult }>> {
        const results: Array<{ questionId: string; result: AIGradingResult }> = [];

        for (const question of questions) {
            try {
                const result = await this.gradeEssayQuestion(
                    question.questionText,
                    question.studentAnswer,
                    question.expectedAnswers,
                    question.maxScore,
                    question.questionType
                );

                results.push({
                    questionId: question.questionId,
                    result
                });

                // Add small delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 100));
            } catch (error) {
                console.error(`Error grading question ${question.questionId}:`, error);
                results.push({
                    questionId: question.questionId,
                    result: {
                        isCorrect: false,
                        scoreObtained: 0,
                        suggestion: 'Error occurred during AI grading. Manual review required.',
                        confidence: 0
                    }
                });
            }
        }

        return results;
    }
}
