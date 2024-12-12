import mongoose from "mongoose";
import { SettingSchema } from "./setting.model";
import { IGroup } from "./interface/igroup";

const { Schema } = mongoose

export const GroupSchema = new Schema<IGroup>({
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