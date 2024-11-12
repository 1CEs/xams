import { ObjectId } from "mongoose";
import { QuestionType } from "../../../../types/exam";

export interface IQuestion {
    _id: ObjectId
    type: QuestionType
    content: string
    contents: string[]
    choices: string[]
    correct: string[]
    score: number
}