import { ObjectId } from "mongoose";
import { IUser } from "./iuser";

export interface IStudent extends IUser {
    join_groups: ObjectId[]
    exam_attempts: ObjectId[]
}