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
    choices: {
        content: string
        number: number
        is_correct: boolean
    }[]
    category: string[]
    settings: {
        point: number
        is_random: 'no' | 'yes'
    }
}