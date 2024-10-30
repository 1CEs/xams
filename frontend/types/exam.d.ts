type ExamResponse = {
    description: string
    instructor_id: string
    questions: []
    title: string
    __v: number
    _id: string
}

type QuestionSelector = 'mc' | 'tf' | string 