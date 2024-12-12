import mongoose, { Document } from "mongoose";
import { GroupSchema } from "./group.model";
import { ICourse } from "./interface/icourse";

const { Schema, model } = mongoose

export const CourseSchema = new Schema<ICourse & Document>({
    instructor_id: {
        type: Schema.Types.String,
        required: true
    },
    background_src: {
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
    }
})

export const CourseModel = model('courses', CourseSchema)