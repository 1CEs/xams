import mongoose from "mongoose";
import { ExaminationScheduleDocument } from "../../../types/exam";
import { QuestionSchema } from "./question.model";

const { Schema, model } = mongoose

export const ExaminationScheduleSchema = new Schema<ExaminationScheduleDocument>({
    original_exam_id: {
        type: Schema.Types.String,
        required: true
    },
    instructor_id: {
        type: Schema.Types.String,
        required: true
    },
    title: {
        type: Schema.Types.String,
        required: true
    },
    description: { type: Schema.Types.String },
    category: { type: [Schema.Types.String] },
    questions: { type: [QuestionSchema] },
    created_at: {
        type: Schema.Types.Date,
        default: Date.now
    }
}, { timestamps: true })

export const ExaminationScheduleModel = model('examination_schedules', ExaminationScheduleSchema)
