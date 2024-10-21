import { ObjectId } from "mongoose";
import { IUser } from "./user";

export interface IInstructor extends IUser {
    courses:        ObjectId[]
    exam_bank:      ObjectId[]
}