import { ObjectId } from "mongoose";

export interface ISubBank {
    _id: ObjectId
    name: string
    parent_id?: string // Reference to parent bank or sub-bank
    sub_banks?: ISubBank[] // Recursive structure to allow nested sub-banks
}
