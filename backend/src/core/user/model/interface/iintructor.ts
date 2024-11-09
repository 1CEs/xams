import { ObjectId } from "mongoose";
import { IUser } from "./iuser";

export interface IInstructor extends IUser {
    categories: {
        _id: ObjectId
        name: string
        color: string
    }
    courses: ObjectId[]
    exam_bank: ObjectId[]
}