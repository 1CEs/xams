import mongoose from "mongoose";
import { IExamination } from "./interface/examination/exam";
import { QuestionType } from "../constants/enums/question-type";

const { Schema, model } = mongoose

export const QuestionSchema = new Schema<IExamination['questions']>([{
    _id: {
        type: Schema.Types.ObjectId
    },
    question_type: {
        type: Schema.Types.String,
        enum: QuestionType,
        required: true
    },
    content: {
        type: Schema.Types.String,
        required: true,
    },
    choices: {
        type: [Schema.Types.String],
        required: true,
    },
    correct_ans: {
        type: [Schema.Types.String],
        required: true,
    },
    hint: {
        type: Schema.Types.String,
        required: true,
    },
    manual_grading: {
        type: Schema.Types.Boolean,
        required: true,
    },
}])

export const ExamSchema = new Schema<IExamination>({
    instructor_id: {
        type: Schema.Types.ObjectId,
        required: true
    },
    title: {
        type: Schema.Types.String,
        required: true
    },
    description: {
        type: Schema.Types.String,
        required: true
    },
    questions: {
        type: [QuestionSchema],
        required: true
    }
})

export const examinationModel = model('examinations', ExamSchema)