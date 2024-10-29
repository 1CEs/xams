import { ObjectId } from "mongoose"
import { IExamination } from "../../../../models/interface/examination/exam"

export interface IExamRepository {
    save: (payload: ExamPayload) => Promise<IExamination>
    find: () => Promise<(Document & IExamination & { _id: ObjectId })[]>
    findById: (_id: ObjectId) => Promise<(Document & IExamination & { _id: ObjectId })[] | null>
    update: (payload: IExamination) => Promise<(Document & IExamination & { _id: ObjectId })[] | null>
    delete: (_id: ObjectId) => Promise<(Document & IExamination & { _id: ObjectId })[] | null>
}