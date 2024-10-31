type ExamResponse = {
    description: string
    instructor_id: string
    questions: []
    title: string
    __v: number
    _id: string
}

type QuestionSelector = 'mc' | 'tf' | string

type QuestionForm = {
    question: string
    type: string
    choices: {
        content: string,
        number: number,
        is_correct: boolean,
    }[]
    feedback: {
        correct: string
        incorrect: string
    },
    category: string[]
    settings: {
        point: number
        is_random: 'no' | 'yes'
    }
}