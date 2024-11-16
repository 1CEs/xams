import { ObjectId } from "mongoose";
import { IUser } from "./iuser";

export interface ICategory {
    _id: ObjectId
    name: string
    color: string
}
export interface IInstructor extends IUser {
    categories: ICategory[]
    courses: ObjectId[]
    exam_bank: ObjectId[]
}