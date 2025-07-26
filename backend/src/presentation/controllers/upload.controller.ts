import { IExamination } from "../../core/examination/model/interface/iexamination";
import { IInstructor } from "../../core/user/model/interface/iintructor";
import { IStudent } from "../../core/user/model/interface/istudent";
import { IUser } from "../../core/user/model/interface/iuser";
import { IUploadController } from "./interface/iupload.controller";

export class UploadController implements IUploadController {
    constructor() { }

    private _response<T>(message: string, code: number, data: T): ControllerResponse<T> {
        return { message, code, data };
    }

    private _parseAikenFormat(content: string): IExamination["questions"] {
        const questions: IExamination["questions"] = []
        const lines = content.split("\n").map(line => line.trim())

        let currentQuestion: string | null = null
        let choices: { content: string; isCorrect: boolean }[] = []
        let correctAnswerIndex: number | null = null

        for (const line of lines) {
            if (!line) continue

            if (line.startsWith("ANSWER:")) {
                const answer = line.split("ANSWER:")[1].trim()
                const answerIndex = answer.charCodeAt(0) - 65
                if (answerIndex < 0 || answerIndex >= choices.length) {
                    console.warn(`Invalid answer: ${answer}. Skipping question.`)
                    currentQuestion = null
                    choices = []
                    correctAnswerIndex = null
                    continue
                }
                correctAnswerIndex = answerIndex

                if (currentQuestion) {
                    questions.push({
                        question: currentQuestion,
                        type: "mc",
                        choices: choices.map((choice, index) => ({
                            content: choice.content,
                            isCorrect: index === correctAnswerIndex,
                            score: index === correctAnswerIndex ? 1 : 0
                        })),
                        score: 1,
                        isRandomChoices: true
                    })
                }
                currentQuestion = null
                choices = []
                correctAnswerIndex = null
                continue
            }

            if (/^[A-Z][).]\s*.+/.test(line)) {
                const choiceText = line.replace(/^[A-Z][).]\s*/, "")
                choices.push({
                    content: choiceText,
                    isCorrect: false
                })
            } else {
                currentQuestion = currentQuestion
                    ? `${currentQuestion} ${line}`
                    : line
            }
        }
        return questions
    }



    async readAikenFormat(user: IUser | IStudent | IInstructor, file: File) {
        try {
            const content = await file.text();

            if (!content.trim()) {
                return this._response("File is empty", 400, []);
            }

            const questions = this._parseAikenFormat(content);

            if (questions.length === 0) {
                return this._response("No valid questions found in the file", 400, []);
            }

            // Note: Duplicate checking will be handled by frontend using localStorage
            return this._response(
                "Read and upload question successfully",
                200,
                questions
            );
        } catch (error) {
            console.error("Error reading Aiken format for user:", user, error);
            return this._response(
                "Failed to read and upload questions due to a server error",
                500,
                []
            );
        }
    }
}
