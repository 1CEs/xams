import mongoose from "mongoose";
import { ICourse } from "./interface/course/course";

const { Schema, model } = mongoose

export const CourseSchema = new Schema<ICourse>({
    instructor_id: {
        type: Schema.Types.ObjectId,
        required: true
    },
    course_name: {
        type: Schema.Types.String,
        required: true
    },
    description: {
        type: Schema.Types.String,
        default: "Description is N/A"
    },
    groups: {
        type: [Schema.Types.ObjectId]
    },
    exams: {
        type: [Schema.Types.ObjectId]
    }
}, { timestamps: true })

export const courseModel = model('courses', CourseSchema)