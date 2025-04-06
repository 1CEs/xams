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

interface Question {
    _id: string
    question: string
    type: 'mc' | 'tf' | 'ses' | 'les' | 'nested'
    choices?: {
        content: string
        isCorrect: boolean
    }[]
    isTrue?: boolean
    expectedAnswer?: string
    maxWords?: number
    score: number
    questions?: Question[] // For nested questions
}

interface ExamResponse {
    _id: string
    title: string
    description: string
    questions: Question[]
}

interface Answer {
    questionId: string
    answers: string[]
    essayAnswer?: string
}

interface ExamResult {
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
