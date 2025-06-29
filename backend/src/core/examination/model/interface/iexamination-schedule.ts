import { ObjectId } from "mongoose";
import { IQuestion } from "./iquestion";

export interface IExaminationSchedule {
    _id: ObjectId
    original_exam_id: string
    instructor_id: string
    title: string
    description: string
    category: string[]
    questions: IQuestion[]
    created_at: Date
}
