import mongoose from "mongoose";
import { IGroup } from "./interface/group/group";

const { Schema, model } = mongoose

export const ExamSettingSchema = new Schema<IGroup['exam_settings']>([{
    exam_id: {
        type: Schema.Types.ObjectId,
        required: true
    },
    open_time: {
        type: Schema.Types.Date,
        required: true
    },
    close_time: {
        type: Schema.Types.Date,
        required: true
    },
    allow_attempts: {
        type: Schema.Types.Number,
        required: true
    },
    allow_review: {
        type: Schema.Types.Boolean,
        required: true
    },
    randomize_q: {
        type: Schema.Types.Boolean,
        required: true
    },
    randomize_a: {
        type: Schema.Types.Boolean,
        required: true
    },
    show_solution: {
        type: Schema.Types.Boolean,
        required: true
    }
}])

export const GroupSchema = new Schema<IGroup>({
    course: {
        type: [Schema.Types.ObjectId]
    },
    name: {
        type: Schema.Types.String,
        required: true
    },
    join_code: {
        type: Schema.Types.String,
        required: true
    },
    students: {
        type: [Schema.Types.ObjectId],
    },
    exam_settings: {
        type: [ExamSettingSchema],
        required: true
    }
})

export const groupModel = model('groups', GroupSchema)