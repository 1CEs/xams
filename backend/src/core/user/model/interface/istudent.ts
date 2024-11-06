import { ObjectId } from "mongoose";
import { IUser } from "./iuser";

export interface IStudent extends IUser {
    enrolls: ObjectId[]
    exam_attempts: ObjectId[]
}