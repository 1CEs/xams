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

            const suggestion = (result as any).generated_text || 'Unable to provide grading suggestion.';
            console.log('AI Response:', suggestion);

            // Simply trust the AI's assessment and extract the percentage/score
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
     * Check if the student answer appears to be valid or nonsensical
     */
    private checkAnswerQuality(studentAnswer: string): { isValid: boolean; reason: string } {
        const answer = studentAnswer.trim();
        
        // Check minimum length
        if (answer.length < 3) {
            return { isValid: false, reason: 'Answer too short' };
        }
        
        // Check if answer is mostly random characters or keyboard mashing
        const randomPatterns = [
            /^[a-z]{1,2}[a-z]{1,2}[a-z]{1,2}[a-z]{1,2}[a-z]{1,2}[a-z]{1,2}$/i, // patterns like "gsdfdsfsdxcxcv"
            /^[xz]{3,}/i, // patterns starting with multiple x's or z's
            /^[qwerty]{5,}/i, // keyboard row patterns
            /^[asdf]{4,}/i, // keyboard row patterns
            /^[zxcv]{4,}/i, // keyboard row patterns
            /^(.)\1{3,}/i, // repeated characters
            /^(.)\1{4,}/, // any character repeated 5+ times
        ];
        
        for (const pattern of randomPatterns) {
            if (pattern.test(answer)) {
                return { isValid: false, reason: 'Appears to be random characters or keyboard mashing' };
            }
        }
        
        // Check if answer contains mostly consonants (sign of random typing)
        const consonantRatio = (answer.match(/[bcdfghjklmnpqrstvwxyz]/gi) || []).length / answer.length;
        if (consonantRatio > 0.8 && answer.length > 5) {
            return { isValid: false, reason: 'Unusually high consonant ratio suggesting random typing' };
        }
        
        // Check for common nonsensical patterns
        const nonsensicalPatterns = [
            /^[a-z]{2,3}[a-z]{2,3}[a-z]{2,3}[a-z]{2,3}$/i, // patterns like "xcvcxvsdfsdf"
            /^[a-z]+[0-9]+[a-z]+$/i, // mixed letters and numbers randomly
            /^[^\s]{8,}$/, // long string without spaces (likely random)
        ];
        
        for (const pattern of nonsensicalPatterns) {
            if (pattern.test(answer) && answer.length > 8) {
                return { isValid: false, reason: 'Matches nonsensical pattern' };
            }
        }
        
        // Check if answer has reasonable word structure
        const words = answer.split(/\s+/);
        const validWords = words.filter(word => {
            // A valid word should have vowels and reasonable length
            return word.length >= 2 && /[aeiou]/i.test(word);
        });
        
        if (validWords.length === 0 && answer.length > 5) {
            return { isValid: false, reason: 'No recognizable words found' };
        }
        
        return { isValid: true, reason: 'Answer appears to be valid' };
    }

    /**
     * Fallback grading using basic keyword matching
     */
    private fallbackGrading(
        studentAnswer: string,
        expectedAnswers: string[],
        maxScore: number
    ): { isCorrect: boolean; scoreObtained: number } {
        if (expectedAnswers.length === 0) {
            return { isCorrect: false, scoreObtained: 0 };
        }

        // Strip HTML tags from student answer for fair comparison
        const submittedText = this.stripHtmlTags(studentAnswer).toLowerCase().trim();
        
        // Check for exact match or partial match
        const isCorrect = expectedAnswers.some((expectedAnswer: string) => {
            // Strip HTML tags from expected answer for fair comparison
            const expectedText = this.stripHtmlTags(expectedAnswer).toLowerCase().trim();
            
            console.log('Comparing answers:');
            console.log('Student (clean):', submittedText);
            console.log('Expected (clean):', expectedText);
            
            return submittedText === expectedText || 
                   (expectedText.length > 10 && submittedText.includes(expectedText)) ||
                   (submittedText.length > 10 && expectedText.includes(submittedText));
        });

        console.log('Fallback grading result:', { isCorrect, scoreObtained: isCorrect ? maxScore : 0 });

        return {
            isCorrect,
            scoreObtained: isCorrect ? maxScore : 0
        };
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
