import { IExamination } from "../../core/examination/model/interface/iexamination";
import { IInstructor } from "../../core/user/model/interface/iintructor";
import { IStudent } from "../../core/user/model/interface/istudent";
import { IUser } from "../../core/user/model/interface/iuser";
import { IUploadController } from "./interface/iupload.controller";
import { ExaminationService } from "../../core/examination/service/exam.service";
import { IExaminationService } from "../../core/examination/service/interface/iexam.service";

export class UploadController implements IUploadController {
    private _examinationService: IExaminationService

    constructor() {
        this._examinationService = new ExaminationService();
    }

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

    private async _validateDuplicateQuestions(questions: IExamination["questions"], instructorId?: string): Promise<{ isValid: boolean, message: string }> {
        // First check for duplicates within the uploaded file
        const questionTexts = questions.map((question, index) => ({ 
            text: question.question.trim().toLowerCase(), 
            originalText: question.question,
            position: index + 1 
        }));
        
        const fileDuplicates: { text: string, positions: number[] }[] = [];
        const seen = new Map<string, number[]>();
        
        questionTexts.forEach(({ text, position }) => {
            if (seen.has(text)) {
                seen.get(text)!.push(position);
            } else {
                seen.set(text, [position]);
            }
        });
        
        for (const [text, positions] of seen.entries()) {
            if (positions.length > 1) {
                const originalQuestion = questionTexts.find(q => q.text === text)?.originalText || text;
                fileDuplicates.push({ text: originalQuestion, positions });
            }
        }
        
        if (fileDuplicates.length > 0) {
            const duplicateDetails = fileDuplicates.map(dup => 
                `"${dup.text.substring(0, 50)}${dup.text.length > 50 ? '...' : ''}" (positions: ${dup.positions.join(', ')})`
            ).join('; ');
            
            return { 
                isValid: false, 
                message: `Duplicate questions found in file: ${duplicateDetails}` 
            };
        }
        
        // Check for duplicates against existing questions in database
        try {
            const dbDuplicates = await this._examinationService.findDuplicateQuestions(questions, instructorId);
            
            if (dbDuplicates.length > 0) {
                const duplicateDetails = dbDuplicates.map(dup => 
                    `"${dup.questionText.substring(0, 50)}${dup.questionText.length > 50 ? '...' : ''}" (exists in exam: ${dup.examTitle})`
                ).join('; ');
                
                return { 
                    isValid: false, 
                    message: `Questions already exist in database: ${duplicateDetails}` 
                };
            }
        } catch (error) {
            console.error('Error checking database duplicates:', error);
            // If database check fails, we'll still allow the upload but log the error
        }
        
        return { isValid: true, message: "" };
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

            // Validate for duplicate questions
            const instructorId = (user as IInstructor)._id?.toString();
            const duplicateValidation = await this._validateDuplicateQuestions(questions, instructorId);
            if (!duplicateValidation.isValid) {
                return this._response(
                    duplicateValidation.message,
                    400,
                    []
                );
            }

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
