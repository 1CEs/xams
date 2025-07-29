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

            // Create model answer from expected answers
            const modelAnswer = expectedAnswers.length > 0 
                ? expectedAnswers.join(' OR ') 
                : 'No specific expected answer provided';

            // Generate grading prompt
            const gradingPrompt = EssayGradingAssistantPrompt(
                questionText,
                modelAnswer,
                studentAnswer,
                maxScore,
                questionType
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

            // Parse AI response to extract score and correctness
            const gradingResult = this.parseAIGradingResponse(suggestion, maxScore);

            return {
                isCorrect: gradingResult.isCorrect,
                scoreObtained: gradingResult.scoreObtained,
                suggestion: suggestion,
                confidence: gradingResult.confidence
            };

        } catch (error) {
            console.error('Error in AI essay grading:', error);
            
            // Fallback: Try basic keyword matching if AI fails
            const fallbackResult = this.fallbackGrading(studentAnswer, expectedAnswers, maxScore);
            
            return {
                isCorrect: fallbackResult.isCorrect,
                scoreObtained: fallbackResult.scoreObtained,
                suggestion: `AI grading failed. Fallback result: ${fallbackResult.isCorrect ? 'Correct' : 'Incorrect'}. Manual review recommended.`,
                confidence: 0.3
            };
        }
    }

    /**
     * Parse AI grading response to extract score and correctness
     */
    private parseAIGradingResponse(response: string, maxScore: number): {
        isCorrect: boolean;
        scoreObtained: number;
        confidence: number;
    } {
        const lowerResponse = response.toLowerCase();
        
        // Look for score patterns in the response
        const scorePatterns = [
            /score[:\s]*(\d+(?:\.\d+)?)\s*\/\s*(\d+)/i,
            /(\d+(?:\.\d+)?)\s*\/\s*(\d+)\s*points?/i,
            /(\d+(?:\.\d+)?)\s*out\s*of\s*(\d+)/i,
            /grade[:\s]*(\d+(?:\.\d+)?)/i,
            /points?[:\s]*(\d+(?:\.\d+)?)/i
        ];

        let extractedScore = 0;
        let confidence = 0.7;

        // Try to extract numerical score
        for (const pattern of scorePatterns) {
            const match = response.match(pattern);
            if (match) {
                if (match[2]) {
                    // Format: score/maxScore
                    extractedScore = parseFloat(match[1]);
                    const detectedMaxScore = parseFloat(match[2]);
                    if (detectedMaxScore !== maxScore) {
                        // Normalize to actual max score
                        extractedScore = (extractedScore / detectedMaxScore) * maxScore;
                    }
                } else {
                    // Format: just score
                    extractedScore = parseFloat(match[1]);
                }
                confidence = 0.8;
                break;
            }
        }

        // If no numerical score found, use keyword analysis
        if (extractedScore === 0) {
            if (lowerResponse.includes('correct') || lowerResponse.includes('good') || 
                lowerResponse.includes('excellent') || lowerResponse.includes('accurate')) {
                extractedScore = maxScore * 0.8; // Give 80% if positive keywords
                confidence = 0.6;
            } else if (lowerResponse.includes('partial') || lowerResponse.includes('somewhat')) {
                extractedScore = maxScore * 0.5; // Give 50% if partial
                confidence = 0.5;
            } else if (lowerResponse.includes('incorrect') || lowerResponse.includes('wrong') || 
                      lowerResponse.includes('poor') || lowerResponse.includes('inadequate')) {
                extractedScore = 0;
                confidence = 0.6;
            } else {
                // Default to half score if unclear
                extractedScore = maxScore * 0.5;
                confidence = 0.3;
            }
        }

        // Ensure score is within bounds
        extractedScore = Math.max(0, Math.min(extractedScore, maxScore));
        
        return {
            isCorrect: extractedScore >= (maxScore * 0.6), // Consider correct if >= 60%
            scoreObtained: Math.round(extractedScore * 100) / 100, // Round to 2 decimal places
            confidence
        };
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

        const submittedText = studentAnswer.toLowerCase().trim();
        
        // Check for exact match or partial match
        const isCorrect = expectedAnswers.some((expectedAnswer: string) => {
            const expectedText = expectedAnswer.toLowerCase().trim();
            return submittedText === expectedText || 
                   (expectedText.length > 10 && submittedText.includes(expectedText)) ||
                   (submittedText.length > 10 && expectedText.includes(submittedText));
        });

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
