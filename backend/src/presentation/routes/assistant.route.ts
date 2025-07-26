import Elysia, { t } from "elysia";
import { InferenceClient } from '@huggingface/inference';
import { AnswerValidatorPrompt, EssayGradingAssistantPrompt } from "../../utils/prompt";

// Initialize Hugging Face client
const hf = new InferenceClient(process.env.HUGGING_FACE_API_KEY);

// Model configuration
const MODEL_NAME = 'google/gemma-3-27b-it';
const VALIDATION_CONFIG = {
    max_new_tokens: 100,
    temperature: 0.7,
    do_sample: true,
    return_full_text: false,
};

const GRADING_CONFIG = {
    max_new_tokens: 200,
    temperature: 0.3, // Lower temperature for more consistent grading
    do_sample: true,
    return_full_text: false,
};

export const AssistantRoute = new Elysia({ prefix: "/assistant" })
    // Original validation endpoint
    .post("/validate", async ({ body }) => {
        try {
            const { question, answer, student_answer } = body;

            if (!question || !answer || !student_answer) {
                return {
                    status: 400,
                    message: "All fields are required: question, answer, and student_answer."
                };
            }

            const inputPrompt = AnswerValidatorPrompt(question, answer, student_answer);

            // Use Hugging Face Inference API for validation
            const result = await hf.chatCompletion({
                provider: 'hf-inference',
                model: MODEL_NAME,
                messages: [
                    {
                        role: "user",
                        content: [
                            {
                                type: "text",
                                text: inputPrompt,
                            },
                        ],
                    },
                ],
                ...VALIDATION_CONFIG
            });

            const generatedText = result.generated_text || "No response generated.";

            return { 
                status: 200, 
                message: "OK", 
                data: result
            };

        } catch (error) {
            console.error('Assistant API Error:', error);
            
            // Handle specific Hugging Face API errors
            if (error instanceof Error) {
                if (error.message.includes('401')) {
                    return {
                        status: 401,
                        message: "Invalid or missing Hugging Face API key.",
                        error: "Authentication failed"
                    };
                }
                if (error.message.includes('429')) {
                    return {
                        status: 429,
                        message: "Rate limit exceeded. Please try again later.",
                        error: "Too many requests"
                    };
                }
                if (error.message.includes('503')) {
                    return {
                        status: 503,
                        message: "Model is currently loading. Please try again in a few moments.",
                        error: "Service temporarily unavailable"
                    };
                }
            }

            return {
                status: 500,
                message: "An error occurred while processing your request.",
                error: error instanceof Error ? error.message : "Unknown error"
            };
        }
    }, {
        body: t.Object({
            question: t.String(),
            answer: t.String(),
            student_answer: t.String(),
        })
    })
    
    // New essay grading assistant endpoint
    .post("/grade-essay", async ({ body }) => {
        try {
            const { question, model_answer, student_answer, max_score, question_type } = body;

            // Validate input
            if (!question || !student_answer || !max_score) {
                return {
                    status: 400,
                    message: "Question, student_answer, and max_score are required."
                };
            }

            // Only handle essay questions
            if (question_type && !['ses', 'les'].includes(question_type)) {
                return {
                    status: 400,
                    message: "This endpoint only handles essay questions (SES/LES types)."
                };
            }

            const gradingPrompt = EssayGradingAssistantPrompt(
                question, 
                model_answer || '', 
                student_answer, 
                max_score,
                question_type
            );

            // Use Hugging Face Inference API for grading assistance
            const result = await hf.chatCompletion({
                provider: 'hf-inference',
                model: MODEL_NAME,
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
                ...GRADING_CONFIG
            });

            const generatedText = result.generated_text || "Unable to provide grading suggestion.";

            return { 
                status: 200, 
                message: "Grading suggestion generated successfully", 
                data: {
                    suggestion: generatedText,
                    question_type: question_type || 'essay',
                    max_score: max_score
                }
            };

        } catch (error) {
            console.error('Essay Grading Assistant API Error:', error);
            
            // Handle specific Hugging Face API errors
            if (error instanceof Error) {
                if (error.message.includes('401')) {
                    return {
                        status: 401,
                        message: "Invalid or missing Hugging Face API key.",
                        error: "Authentication failed"
                    };
                }
                if (error.message.includes('429')) {
                    return {
                        status: 429,
                        message: "Rate limit exceeded. Please try again later.",
                        error: "Too many requests"
                    };
                }
                if (error.message.includes('503')) {
                    return {
                        status: 503,
                        message: "Model is currently loading. Please try again in a few moments.",
                        error: "Service temporarily unavailable"
                    };
                }
            }

            return {
                status: 500,
                message: "An error occurred while generating grading suggestion.",
                error: error instanceof Error ? error.message : "Unknown error"
            };
        }
    }, {
        body: t.Object({
            question: t.String(),
            model_answer: t.Optional(t.String()),
            student_answer: t.String(),
            max_score: t.Number(),
            question_type: t.Optional(t.Union([t.Literal('ses'), t.Literal('les')]))
        })
    })
    
    // Bulk essay grading assistant endpoint
    .post("/bulk-grade-essays", async ({ body }) => {
        try {
            const { submissions, scope } = body;

            if (!submissions || !Array.isArray(submissions) || submissions.length === 0) {
                return {
                    status: 400,
                    message: "Submissions array is required and cannot be empty."
                };
            }

            const results = [];
            const errors = [];

            for (const submission of submissions) {
                const { submission_id, student_id, student_name, essay_questions } = submission;

                if (!essay_questions || !Array.isArray(essay_questions)) {
                    errors.push({
                        submission_id,
                        student_id,
                        error: "No essay questions found in submission"
                    });
                    continue;
                }

                const questionResults = [];

                for (const question of essay_questions) {
                    const { question_id, question_text, student_answer, max_score, question_type } = question;

                    // Only process essay questions
                    if (!['ses', 'les'].includes(question_type)) {
                        continue;
                    }

                    if (!question_text || !student_answer) {
                        questionResults.push({
                            question_id,
                            error: "Missing question text or student answer"
                        });
                        continue;
                    }

                    try {
                        const gradingPrompt = EssayGradingAssistantPrompt(
                            question_text,
                            '', // No model answer for bulk processing 
                            student_answer,
                            max_score,
                            question_type
                        );

                        // Use Hugging Face Inference API for grading assistance
                        const result = await hf.chatCompletion({
                            provider: 'hf-inference',
                            model: MODEL_NAME,
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
                            ...GRADING_CONFIG
                        });

                        const suggestion = result.generated_text || "Unable to provide grading suggestion.";

                        questionResults.push({
                            question_id,
                            question_type,
                            max_score,
                            suggestion,
                            success: true
                        });

                    } catch (questionError) {
                        console.error(`Error processing question ${question_id}:`, questionError);
                        questionResults.push({
                            question_id,
                            error: questionError instanceof Error ? questionError.message : "Unknown error"
                        });
                    }
                }

                results.push({
                    submission_id,
                    student_id,
                    student_name,
                    questions: questionResults,
                    processed_essays: questionResults.filter(q => q.success).length,
                    total_essays: essay_questions.filter(q => ['ses', 'les'].includes(q.question_type)).length
                });
            }

            return {
                status: 200,
                message: "Bulk grading suggestions generated",
                data: {
                    results,
                    errors,
                    summary: {
                        total_submissions: submissions.length,
                        processed_submissions: results.length,
                        total_essay_questions: results.reduce((sum, r) => sum + r.total_essays, 0),
                        processed_essay_questions: results.reduce((sum, r) => sum + r.processed_essays, 0),
                        scope
                    }
                }
            };

        } catch (error) {
            console.error('Bulk Essay Grading Assistant API Error:', error);
            
            // Handle specific Hugging Face API errors
            if (error instanceof Error) {
                if (error.message.includes('401')) {
                    return {
                        status: 401,
                        message: "Invalid or missing Hugging Face API key.",
                        error: "Authentication failed"
                    };
                }
                if (error.message.includes('429')) {
                    return {
                        status: 429,
                        message: "Rate limit exceeded. Please try again later.",
                        error: "Too many requests"
                    };
                }
                if (error.message.includes('503')) {
                    return {
                        status: 503,
                        message: "Model is currently loading. Please try again in a few moments.",
                        error: "Service temporarily unavailable"
                    };
                }
            }

            return {
                status: 500,
                message: "An error occurred while generating bulk grading suggestions.",
                error: error instanceof Error ? error.message : "Unknown error"
            };
        }
    }, {
        body: t.Object({
            submissions: t.Array(t.Object({
                submission_id: t.String(),
                student_id: t.String(),
                student_name: t.String(),
                essay_questions: t.Array(t.Object({
                    question_id: t.String(),
                    question_text: t.String(),
                    student_answer: t.String(),
                    max_score: t.Number(),
                    question_type: t.Union([t.Literal('ses'), t.Literal('les')])
                }))
            })),
            scope: t.Union([t.Literal('all'), t.Literal('ungraded'), t.Literal('selected')])
        })
    });