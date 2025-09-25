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

            console.log('Processing student answer:', studentAnswer.trim());

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
        console.log('Parsing AI response:', response);
        
        let extractedScore = 0;
        let confidence = 0.8;
        
        // Strategy 1: Look for percentage in parentheses like "(100%)" or "(85%)"
        const percentageInParentheses = response.match(/\((\d+(?:\.\d+)?)%\)/);
        if (percentageInParentheses) {
            const percentage = parseFloat(percentageInParentheses[1]);
            extractedScore = (percentage / 100) * maxScore;
            console.log('Using percentage from parentheses:', percentage + '%');
            confidence = 0.95;
        } else {
            // Strategy 2: Look for "XX%" pattern
            const percentagePattern = response.match(/(\d+(?:\.\d+)?)%/);
            if (percentagePattern) {
                const percentage = parseFloat(percentagePattern[1]);
                extractedScore = (percentage / 100) * maxScore;
                console.log('Using percentage pattern:', percentage + '%');
                confidence = 0.9;
            } else {
                // Strategy 3: Look for "SCORE: X/Y" pattern
                const scorePattern = response.match(/SCORE:\s*(\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)/i);
                if (scorePattern) {
                    const numerator = parseFloat(scorePattern[1]);
                    const denominator = parseFloat(scorePattern[2]);
                    if (denominator > 0) {
                        extractedScore = (numerator / denominator) * maxScore;
                        console.log('Using score pattern:', numerator + '/' + denominator);
                        confidence = 0.9;
                    }
                } else {
                    // Strategy 4: Extract all numbers and use heuristics
                    const numbers = response.match(/\d+(?:\.\d+)?/g);
                    if (numbers && numbers.length > 0) {
                        // Look for numbers that could be percentages (usually larger values in 0-100 range)
                        const numericValues = numbers.map(n => parseFloat(n));
                        const potentialPercentages = numericValues.filter(n => n >= 0 && n <= 100);
                        
                        if (potentialPercentages.length > 0) {
                            // Prefer the largest percentage value (usually the final percentage)
                            const percentage = Math.max(...potentialPercentages);
                            extractedScore = (percentage / 100) * maxScore;
                            console.log('Using largest percentage from numbers:', percentage + '%');
                            confidence = 0.7;
                        } else {
                            // Look for scores in the maxScore range
                            const scores = numericValues.filter(n => n >= 0 && n <= maxScore);
                            if (scores.length > 0) {
                                extractedScore = scores[0];
                                console.log('Using direct score:', extractedScore);
                                confidence = 0.7;
                            } else {
                                // Fallback to first number
                                const firstNumber = numericValues[0];
                                if (firstNumber > maxScore && firstNumber <= 100) {
                                    extractedScore = (firstNumber / 100) * maxScore;
                                } else {
                                    extractedScore = Math.min(firstNumber, maxScore);
                                }
                                console.log('Using fallback number:', extractedScore);
                                confidence = 0.5;
                            }
                        }
                    } else {
                        // No numbers found, give a default score
                        extractedScore = maxScore * 0.5; // Give 50% as neutral score
                        console.log('No numbers found, using default 50%');
                        confidence = 0.3;
                    }
                }
            }
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
