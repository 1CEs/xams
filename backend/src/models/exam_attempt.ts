import mongoose from "mongoose";
import { IExaminationAttempt } from "./interface/examination_attempt/exam_attempt";

const { Schema, model } = mongoose

export const ExamAttemptSchema = new Schema<IExaminationAttempt>({
    student_id: {
        type: Schema.Types.ObjectId,
        required: true
    },
    exam_id: {
        type: Schema.Types.ObjectId,
        required: true
    },
    attempt_number: {
        type: Schema.Types.Number,
        required: true
    },
    score: {
        type: Schema.Types.Number,
        required: true
    },
    questions: {
        type: [{
            question_id: {
                type: Schema.Types.ObjectId,
                required: true
            },
            student_ans: {
                type: Schema.Types.String,
                required: true
            },
            score: {
                type: Schema.Types.Number,
                required: true
            },
        }],
        required: true
    }
})