import mongoose from "mongoose";
import { GroupSchema } from "./group.model";

const { Schema } = mongoose

export const CourseSchema = new Schema ({
    instructor_id: {
        type: Schema.Types.String,
        required: true
    },
    course_name: {
        type: Schema.Types.String,
        required: true
    },
    description: {
        type: Schema.Types.String,
        required: true
    },
    groups: {
        type: [GroupSchema],
        required: true
    }
})