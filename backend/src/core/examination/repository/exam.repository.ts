
import { ExaminationDocument } from "../../../types/exam";
import { BaseRepository } from "../../base/base.repository";
import { ExaminationModel } from "../model/examination.model";
import { IQuestion } from "../model/interface/iquestion";
import { IExaminationRepository } from "./interface/iexam.repository";

export class ExaminationRepository 
        extends BaseRepository<ExaminationDocument> 
        implements IExaminationRepository {

    constructor() {
        super(ExaminationModel)
    }

    async addExaminationQuestion(id: string, payload: Omit<IQuestion, "_id">) {
        const result = await this._model.findByIdAndUpdate(id, { $push: { questions: payload }}, { new: true })
        return result
    }

    async updateQuestion(id: string, question_id: string, payload: Partial<IQuestion>) {
        const result = await this._model.findOneAndUpdate(
            { _id: id, 'questions._id': question_id }, 
            { $set: { "questions.$": payload } },
            { new: true }
        )
        return result
    }

}