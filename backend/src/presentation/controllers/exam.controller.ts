import { IExamination } from "../../core/examination/model/interface/iexamination";
import { IQuestion } from "../../core/examination/model/interface/iquestion";
import { ExaminationService } from "../../core/examination/service/exam.service";
import { IExaminationService } from "../../core/examination/service/interface/iexam.service";
import { IInstructor } from "../../core/user/model/interface/iintructor";
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
    async addExamination(payload: Omit<IExamination, "_id" | "questions">) {
        const exam = await this._service.addExamination(payload)
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

    async updateExamination(id: string, payload: Partial<IExamination>) {
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
}