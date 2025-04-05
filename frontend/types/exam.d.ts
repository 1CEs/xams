type ExamResponse = {
    description: string
    instructor_id: string
    questions: QuestionWithIdentifier<QuestionForm>[] | never[]
    title: string
    __v: number
    _id: string
}

type QuestionSelector = "tf" | "les" | "mc" | "ses" | "nested"

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
    questions?: QuestionForm[]
}

type QuestionWithIdentifier<T> = T & {
    id: number
    _id?: string
}

type NestedQuestionForm = {
    question: string
    questions: QuestionForm[] | never[]
}
