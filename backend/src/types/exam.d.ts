import { Document } from "mongoose"
import { IExamination } from "../core/examination/model/interface/iexamination"
import { IExaminationSchedule } from "../core/examination/model/interface/iexamination-schedule"
import { IQuestion } from "../core/examination/model/interface/iquestion"

declare type QuestionType = 'mc' | 'tf' | 'ses' | 'les' | 'nested'
declare type Choice = {
    content: string
}

declare type ExaminationDocument = IExamination & Document
declare type ExaminationScheduleDocument = IExaminationSchedule & Document
declare type QuestionDocument = IQuestion & Document
declare type Answer = {
    questionId: string
    answers: string[]
    essayAnswer?: string
}

declare type SubmitAnswer = {
    exam_id: string
    answers: Answer[]
}

declare type ExamResult = {
    totalScore: number
    obtainedScore: number
    correctAnswers: number
    totalQuestions: number
    details: {
        questionId: string
        isCorrect: boolean
        userAnswer: string[]
        correctAnswer: string[]
        score: number
    }[]
}