type ExamResponse = {
    description: string
    instructor_id: string
    questions: []
    title: string
    __v: number
    _id: string
}

type QuestionSelector = 'mc' | 'tf' | 'ses' | 'les'

type QuestionForm = {
    question: string
    type: QuestionSelector
    choices: string[]
    answer: string[]
    category: string[]
    score: number
}