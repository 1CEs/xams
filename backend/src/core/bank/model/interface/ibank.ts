import { ObjectId } from "mongoose";
import { ISubBank } from "./isub-bank";

export interface IBank {
    _id: ObjectId
    bank_name: string
    exam_ids?: string[] // Changed from single exam_id to array of exam_ids
    sub_banks?: ISubBank[]
}
