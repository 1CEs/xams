import { ObjectId } from "mongoose";
import { QuestionType } from "../../../../types/exam";

export interface IQuestion {
    question: string
    type: QuestionType
    choices: string[]
    answer: string[]
    category: string[]
    score: number
}