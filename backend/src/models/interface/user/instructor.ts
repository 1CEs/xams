import { ObjectId } from "mongoose";
import { IUser } from "./user";

export interface IInstructor extends IUser {
    courses:        ObjectId[]
    exam_bank:      ObjectId[]
    question_bank:  ObjectId[]
    my_category:    {
        _id:    ObjectId
        name:   string
        color:  string
    }[]
}