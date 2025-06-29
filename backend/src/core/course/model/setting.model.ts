import mongoose from "mongoose";
import { ISetting } from "./interface/setting";

const { Schema } = mongoose

export const SettingSchema = new Schema<ISetting>({
    exam_id: {
        type: Schema.Types.String,
        required: true
    },
    schedule_id: {
        type: Schema.Types.String
    },
    schedule_name: {
        type: Schema.Types.String
    },
    open_time: {
        type: Schema.Types.Date,
        required: true
    },
    close_time: {
        type: Schema.Types.Date,
        required: true
    },
    ip_range: {
        type: Schema.Types.String
    },
    exam_code: {
        type: Schema.Types.String
    },
    allowed_attempts: {
        type: Schema.Types.Number,
        required: true
    },
    allowed_review: {
        type: Schema.Types.Boolean,
        required: true
    },
    show_answer: {
        type: Schema.Types.Boolean,
        required: true
    },
    randomize_question: {
        type: Schema.Types.Boolean,
        required: true
    },
    randomize_choice: {
        type: Schema.Types.Boolean,
        required: true
    },
    question_count: {
        type: Schema.Types.Number
    }
})
