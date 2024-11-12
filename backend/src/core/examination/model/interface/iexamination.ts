import { ObjectId } from "mongoose";
import { IQuestion } from "./iquestion";

export interface IExamination {
    _id: ObjectId
    instructor_id: string
    title: string
    description: string
    questions: IQuestion[]
}