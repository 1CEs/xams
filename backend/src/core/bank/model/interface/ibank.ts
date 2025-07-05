import { ObjectId } from "mongoose";
import { ISubBank } from "./isub-bank";

export interface IBank {
    _id: ObjectId
    bank_name: string
    exam_id: string
    sub_banks?: ISubBank[]
}
