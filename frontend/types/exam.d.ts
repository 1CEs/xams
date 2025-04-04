type ExamResponse = {
    description: string
    instructor_id: string
    questions: QuestionWithIdentifier<QuestionForm>[] | never[]
    title: string
    __v: number
    _id: string
}

type QuestionSelector = 'mc' | 'tf' | 'ses' | 'les'

type QuestionForm = {
    question: string
    type: QuestionSelector
    choices?: {
        content: string
        isCorrect: boolean
    }[]
    isTrue?: boolean
    expectedAnswer?: string
    maxWords?: number
    score: number
}

type QuestionWithIdentifier<T extends QuestionForm> = T & { id: number, _id: string }

type NestedQuestionForm = {
    question: string
    questions: QuestionForm[] | never[]
}
