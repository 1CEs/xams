import { ObjectId } from "mongoose";
import { IUser } from "./iuser";

export interface IStudent extends IUser {
    enroll: ObjectId[]
    exam_attempts: ObjectId[]
}