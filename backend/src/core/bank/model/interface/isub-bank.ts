import { ObjectId } from "mongoose";

export interface ISubBank {
    _id: ObjectId
    name: string
    exam_ids?: string[] // Changed from single exam_id to array of exam_ids
    parent_id?: string // Reference to parent bank or sub-bank
    sub_banks?: ISubBank[] // Recursive structure to allow nested sub-banks
}
