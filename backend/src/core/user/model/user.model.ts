import mongoose from "mongoose"
import { IUser } from "./interface/iuser"

const { Schema, model } = mongoose

export const UserSchema = new Schema<IUser> ({
    _id: {type: Schema.ObjectId},
    email: {
        type: Schema.Types.String,
        require: true
    }
})