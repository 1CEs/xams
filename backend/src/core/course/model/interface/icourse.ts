import { ObjectId } from "mongoose";
import { IGroup } from "./igroup";

export interface ICourse {
    _id: ObjectId
    instructor_id: string
    background_src: string
    course_name: string
    description?: string
    groups?: IGroup[]
}