import { QuestionType } from "../../../../types/exam";

export interface IQuestion {
    question: string
    type: QuestionType
    isRandomChoices?: boolean
    choices?: {
        content: string
        isCorrect: boolean
        score: number
    }[]
    isTrue?: boolean
    expectedAnswer?: string
    maxWords?: number
    score: number
    questions?: IQuestion[] // Only present when type is 'nested'
}