import mongoose from "mongoose";
import { SettingSchema } from "./setting.model";

const { Schema } = mongoose

export const GroupSchema = new Schema ({
    group_name: {
        type: Schema.Types.String,
        required: true
    },
    join_code: {
        type: Schema.Types.String,
        required: true
    },
    students: {
        type: [Schema.Types.String],
        required: true
    },
    exam_setting: {
        type: [SettingSchema],
        required: true
    }
}, { _id: true })