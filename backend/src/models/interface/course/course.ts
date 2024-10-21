import { ObjectId } from "mongoose";

export interface ICourse {
    _id:                ObjectId
    instructor_id:      ObjectId
    course_name:        string
    description:        string
    groups:             ObjectId[]
    exams:              ObjectId[]
}