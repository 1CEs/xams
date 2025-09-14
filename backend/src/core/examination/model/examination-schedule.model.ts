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
    questions: [Schema.Types.Mixed],
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
    question_count: { type: Number },
    total_score: { type: Number }, // Total score for the exam schedule
    assistant_grading: { type: Boolean }, // Enable AI assistant grading
    time_taken: { type: Number } // Time limit for the exam in minutes
}, { timestamps: true })

export const ExaminationScheduleModel = model('examination_schedules', ExaminationScheduleSchema)
