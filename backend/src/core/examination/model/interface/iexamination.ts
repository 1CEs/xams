import { ObjectId } from "mongoose";
import { IQuestion } from "./iquestion";

export interface IExamination {
    _id: ObjectId
    instructor_id: string
    title: string
    description: string
    category: string[]
    questions: IQuestion[]
    group_id?: string
    password?: string
}