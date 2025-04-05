import { IExamination } from "../model/interface/iexamination";
import { IQuestion } from "../model/interface/iquestion";
import { ExaminationRepository } from "../repository/exam.repository";
import { IExaminationRepository } from "../repository/interface/iexam.repository";
import { IExaminationService } from "./interface/iexam.service";

export class ExaminationService implements IExaminationService {
    private _repository: IExaminationRepository

    constructor() {
        this._repository = new ExaminationRepository
    }

    async addExamination(payload: Omit<IExamination, "_id" | 'questions'>) {
        const result = await this._repository.save(payload)
        return result
    }

    async getExaminations() {
        const result = await this._repository.find()
        return result
    }

    async getExaminationById(id: string) {
        const result = await this._repository.findById(id)
        return result
    }

    async getExaminationByInstructorId (instructor_id: string) {
        const result = await this._repository.getExaminationByInstructorId(instructor_id)
        return result
    }

    async updateExamination(id: string, payload: Partial<IExamination>) {
        const result = await this._repository.update(id, payload)
        return result
    }

    async deleteExamination(id: string) {
        const result = await this._repository.delete(id)
        return result
    }

    async addExaminationQuestion(id: string, payload: Omit<IQuestion, "_id">) {
        const result = await this._repository.addExaminationQuestion(id, payload)
        return result
    }

    async updateQuestion(id: string, question_id: string, payload: Partial<IQuestion>) {
        const result = await this._repository.updateQuestion(id, question_id, payload)
        return result
    }

    async deleteQuestion(id: string, question_id: string) {
        const result = await this._repository.deleteQuestion(id, question_id)
        return result
    }

    // Nested Question methods
    async addNestedQuestion(id: string, payload: { question: string; type: string; score: number; questions: IQuestion[] }) {
        const result = await this._repository.addNestedQuestion(id, payload)
        return result
    }
}