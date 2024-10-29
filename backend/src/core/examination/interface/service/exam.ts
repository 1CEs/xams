import { ObjectId } from "mongoose"
import { IExamination } from "../../../../models/interface/examination/exam"

export interface IExamService {
    saveService: (payload: ExamPayload) => Promise<IExamination>
    findService: () => Promise<(Document & IExamination & { _id: ObjectId })[]>
    findByIdService: (_id: ObjectId) => Promise<(Document & IExamination & { _id: ObjectId })[] | null>
    updateService: (payload: IExamination) => Promise<(Document & IExamination & { _id: ObjectId })[] | null>
    deleteService: (_id: ObjectId) => Promise<(Document & IExamination & { _id: ObjectId })[] | null>
}