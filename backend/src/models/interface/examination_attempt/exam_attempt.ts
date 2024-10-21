import { ObjectId } from "mongoose";

export interface IExaminationAttempt {
    _id:                ObjectId
    student_id:         ObjectId
    exam_id:            ObjectId
    attempt_number:     number
    score:              number
    questions: {
        question_id:        ObjectId
        student_ans:        string
        score:              number
    }[]
}
