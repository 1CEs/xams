import { ObjectId } from "mongoose";
import { IUser } from "./iuser";

export interface IInstructor extends IUser {
    courses: ObjectId[]
    bank: ObjectId[]
}