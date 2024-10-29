import { ObjectId } from "mongoose";
import { examinationModel } from "../../models/exam";
import { IExamination } from "../../models/interface/examination/exam";
import { UserPayloadType } from "../../types/user";
import { IExamRepository } from "./interface/repository/exam";


export class ExamRepository implements IExamRepository {
    private model: typeof examinationModel

    constructor() {
        this.model = examinationModel
    }

    async save(payload: ExamPayload) {
        return await new this.model(payload).save()
    }

    async find(): Promise<(Document & IExamination & { _id: ObjectId })[]> {
        return await this.model.find()
    }

    async findById(_id: ObjectId): Promise<(Document & IExamination & { _id: ObjectId })[] | null> {
        return await this.model.findById(_id)
    }

    async update(payload: IExamination): Promise<(Document & IExamination & { _id: ObjectId })[] | null> {
        return await this.model.findByIdAndUpdate(payload._id, payload)
    }

    async delete(_id: ObjectId): Promise<(Document & IExamination & { _id: ObjectId })[] | null> {
        return await this.model.findByIdAndDelete(_id)
    }
}