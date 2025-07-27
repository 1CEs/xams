import mongoose from "mongoose";
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
    schedule_ids: {
        type: [Schema.Types.String],
        required: true,
        default: []
    }
}, { _id: true })