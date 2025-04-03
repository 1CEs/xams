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

        return this._response<typeof exam>('Create Examination Successfully', 200, exam)
    }

    async getExaminations() {
        const exams = await this._service.getExaminations()
        return this._response<typeof exams>('Done', 200, exams)
    }

    async getExaminationById(id: string) {
        const exam = await this._service.getExaminationById(id)
        return this._response<typeof exam>('Done', 200, exam)
    }

    async getExaminationByInstructorId (instructor_id: string) {
        const exams = await this._service.getExaminationByInstructorId(instructor_id)
        return this._response<typeof exams>('Done', 200, exams)
    }

    async updateExamination(id: string, payload: Partial<IExamination>) {
        // If category is provided but null, set it to an empty array
        if (payload.hasOwnProperty('category') && !payload.category) {
            payload.category = []
        }
        
        const updated = await this._service.updateExamination(id, payload)
        return this._response<typeof updated>('Update Examination Successfully', 200, updated)
    }

    async deleteExamination(id: string) {
        const deleted = await this._service.deleteExamination(id)
        return this._response<typeof deleted>('Delete Examination Successfully', 200, deleted)
    }

    // Question-Only methods
    async addExaminationQuestion(id: string, payload: Omit<IQuestion, '_id'>) {
        const exam = await this._service.addExaminationQuestion(id, payload)
        return this._response<typeof exam>('Add Question Successfully', 200, exam)
    }

    async updateQuestion(id: string, question_id: string, payload: Partial<IQuestion>) {
        const exam = await this._service.updateQuestion(id, question_id, payload)
        return this._response<typeof exam>('Update Question Successfully', 200, exam)
    }

    async deleteQuestion (id: string, question_id: string){
        const exam = await this._service.deleteQuestion(id, question_id)
        return this._response<typeof exam>('Delete Question Successfully', 200, exam)
    }
}
