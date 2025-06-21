import Elysia, { t } from "elysia";
import { AnswerValidatorPrompt } from "../../utils/prompt";

export const AssistantRoute = new Elysia({ prefix: "/assistant" })
    .post("/", async ({ body }) => {
        try {
            const { question, answer, student_answer } = body;
            const openRouterAPIKey = process.env.OPEN_ROUTER_API_KEY;
            if (!openRouterAPIKey) {
                return {
                    status: 500,
                    message: "OPEN_ROUTER_API_KEY is not set in the environment variables."
                }
            }

            if (!question || !answer || !student_answer) {
                return {
                    status: 400,
                    message: "All fields are required: question, answer, and student_answer."
                }
            }

            const openRouterPayload = {
                model: "google/gemma-3-27b-it:free",
                messages: [
                    {
                        role: "system",
                        content: "You are an instructor assistant that grades student answers."
                    },
                    {
                        role: "user",
                        content: AnswerValidatorPrompt(question, answer, student_answer)
                    }
                ]
            };

            const completionRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${openRouterAPIKey}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(openRouterPayload)
            });

            if (!completionRes.ok) {
                const errorText = await completionRes.text();
                console.error(errorText);
                return { status: completionRes.status, message: errorText };
            }

            const data = await completionRes.json();    

            return { status: 200, message: "OK", data };

        } catch (error) {
            return {
                status: 500,
                message: "An error occurred while processing your request.",
                error: error instanceof Error ? error.message : "Unknown error"
            }
        }
    }, {
        body: t.Object({
            question: t.String(),
            answer: t.String(),
            student_answer: t.String(),
        })
    })