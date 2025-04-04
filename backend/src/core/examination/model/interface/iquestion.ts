import { QuestionType } from "../../../../types/exam";

export interface IQuestion {
    question: string
    type: QuestionType
    choices?: {
        content: string
        isCorrect: boolean
    }[]
    isTrue?: boolean
    expectedAnswer?: string
    maxWords?: number
    score: number
}