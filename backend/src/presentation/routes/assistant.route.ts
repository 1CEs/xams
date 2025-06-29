import Elysia, { t } from "elysia";
import { InferenceClient } from '@huggingface/inference';
import { AnswerValidatorPrompt } from "../../utils/prompt";

// Initialize Hugging Face client
const hf = new InferenceClient(process.env.HUGGING_FACE_API_KEY);

// Model configuration
const MODEL_NAME = 'google/gemma-3-27b-it'; // Updated model name
const GENERATION_CONFIG = {
    max_new_tokens: 100,
    temperature: 0.7,
    do_sample: true,
    return_full_text: false, // Only return generated text, not the prompt
};

export const AssistantRoute = new Elysia({ prefix: "/assistant" })
    .post("/", async ({ body }) => {
        try {
            const { question, answer, student_answer } = body;

            if (!question || !answer || !student_answer) {
                return {
                    status: 400,
                    message: "All fields are required: question, answer, and student_answer."
                };
            }

            const inputPrompt = AnswerValidatorPrompt(question, answer, student_answer);

            // Use Hugging Face Inference API
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
    });