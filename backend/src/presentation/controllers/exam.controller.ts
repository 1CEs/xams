import { IExamination } from "../../core/examination/model/interface/iexamination";
import { IQuestion } from "../../core/examination/model/interface/iquestion";
import { ExaminationService } from "../../core/examination/service/exam.service";
import { IExaminationService } from "../../core/examination/service/interface/iexam.service";
import { IInstructor } from "../../core/user/model/interface/iintructor";
import { InstructorService } from "../../core/user/service/instructor.service";
import { UserServiceFactory } from "../../core/user/service/user.factory";
import { IExaminationController } from "./interface/iexam.controller";

export class ExaminationController implements IExaminationController {
    private _service: IExaminationService

    constructor() {
        this._service = new ExaminationService()
    }

    private _response<T>(message: string, code: number, data: T) {
        return {
            message,
            code,
            data
        }
    }

    /**
     * Removes sensitive data from examination objects
     * @param exam Examination object or array of examination objects
     * @returns Sanitized examination object(s) without sensitive data
     */
    private _sanitizeExamData(exam: IExamination | IExamination[] | null): any {
        if (!exam) return null;

        // Function to sanitize a single examination
        const sanitizeExam = (examination: IExamination) => {
            // Create a deep copy to avoid modifying the original
            const sanitized = JSON.parse(JSON.stringify(examination));
            
            // Sanitize questions if they exist
            if (sanitized.questions && sanitized.questions.length > 0) {
                sanitized.questions = sanitized.questions.map((question: IQuestion) => {
                    // Replace the answer with an empty array instead of removing it
                    return {
                        ...question,
                        answer: []
                    };
                });
            }
            
            return sanitized;
        };

        // Handle both single exam and array of exams
        if (Array.isArray(exam)) {
            return exam.map(e => sanitizeExam(e));
        } else {
            return sanitizeExam(exam);
        }
    }

    // Examination-Only methods
    async addExamination(payload: Omit<IExamination, "_id" | "questions">, user: IInstructor) {
        console.log(user)
        // Ensure category is set, default to empty array if not provided
        if (!payload.category) {
            payload.category = []
        }
        
        const exam = await this._service.addExamination(payload)
        const service = new UserServiceFactory().createService(user.role)

        const update = (service as InstructorService).updateExam(user._id as unknown as string, exam?._id as unknown as string)

        return this._response<typeof exam>('Create Examination Successfully', 200, this._sanitizeExamData(exam))
    }

    async getExaminations() {
        const exams = await this._service.getExaminations()
        return this._response<typeof exams>('Done', 200, this._sanitizeExamData(exams))
    }

    async getExaminationById(id: string) {
        const exam = await this._service.getExaminationById(id)
        return this._response<typeof exam>('Done', 200, this._sanitizeExamData(exam))
    }

    async getExaminationByInstructorId (instructor_id: string) {
        const exams = await this._service.getExaminationByInstructorId(instructor_id)
        return this._response<typeof exams>('Done', 200, this._sanitizeExamData(exams))
    }

    async updateExamination(id: string, payload: Partial<IExamination>) {
        // If category is provided but null, set it to an empty array
        if (payload.hasOwnProperty('category') && !payload.category) {
            payload.category = []
        }
        
        const updated = await this._service.updateExamination(id, payload)
        return this._response<typeof updated>('Update Examination Successfully', 200, this._sanitizeExamData(updated))
    }

    async deleteExamination(id: string) {
        const deleted = await this._service.deleteExamination(id)
        return this._response<typeof deleted>('Delete Examination Successfully', 200, this._sanitizeExamData(deleted))
    }

    // Question-Only methods
    async addExaminationQuestion(id: string, payload: Omit<IQuestion, '_id'>) {
        const exam = await this._service.addExaminationQuestion(id, payload)
        return this._response<typeof exam>('Add Question Successfully', 200, this._sanitizeExamData(exam))
    }

    async updateQuestion(id: string, question_id: string, payload: Partial<IQuestion>) {
        const exam = await this._service.updateQuestion(id, question_id, payload)
        return this._response<typeof exam>('Update Question Successfully', 200, this._sanitizeExamData(exam))
    }

    async deleteQuestion (id: string, question_id: string){
        const exam = await this._service.deleteQuestion(id, question_id)
        return this._response<typeof exam>('Delete Question Successfully', 200, this._sanitizeExamData(exam))
    }
}
