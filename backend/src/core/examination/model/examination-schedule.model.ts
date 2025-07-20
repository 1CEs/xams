import mongoose from "mongoose";
import { ExaminationScheduleDocument } from "../../../types/exam";
import { QuestionSchema } from "./question.model";

const { Schema, model } = mongoose

export const ExaminationScheduleSchema = new Schema<ExaminationScheduleDocument>({
    exam_ids: {
        type: [String],
        required: true
    },
    instructor_id: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    description: { type: String },
    category: { type: [String] },
    questions: [Schema.Types.Mixed],
    created_at: {
        type: Date,
        default: Date.now
    },
    // Exam settings
    open_time: { type: Date },
    close_time: { type: Date },
    ip_range: { type: String },
    exam_code: { type: String },
    allowed_attempts: { type: Number },
    allowed_review: { type: Boolean },
    show_answer: { type: Boolean },
    randomize_question: { type: Boolean },
    randomize_choice: { type: Boolean },
    question_count: { type: Number }
}, { timestamps: true })

export const ExaminationScheduleModel = model('examination_schedules', ExaminationScheduleSchema)
