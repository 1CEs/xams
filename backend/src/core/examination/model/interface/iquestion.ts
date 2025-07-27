import { QuestionType } from "../../../../types/exam";
import { ObjectId } from "mongoose";

export interface IQuestion {
    _id?: ObjectId
    question: string
    type: QuestionType
    isRandomChoices?: boolean
    choices?: {
        content: string
        isCorrect: boolean
        score: number
    }[]
    isTrue?: boolean
    expectedAnswers?: string[]
    maxWords?: number
    score: number
    questions?: IQuestion[] // Only present when type is 'nested'
}