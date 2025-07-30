import mongoose from "mongoose"
import { IUser } from "./interface/iuser"
import { IUserDocument } from "../../../types/user"

const { Schema, model } = mongoose

const UserInfoSchema = new Schema<IUser['info']>({
    first_name: {
        type: Schema.Types.String,
        required: true
    },
    last_name: {
        type: Schema.Types.String,
        required: true
    }
}, {_id: false})

const UserSchema = new Schema<IUserDocument>({
    username: {
        type: Schema.Types.String,
        required: true,
        index: true,
        unique: true
    },
    email: {
        type: Schema.Types.String,
        required: true,
        index: true,
        unique: true
    },
    password: {
        type: Schema.Types.String,
        required: true
    },
    profile_url: { 
        type: Schema.Types.String,
        required: true
    },
    bio: {
        type: Schema.Types.String,
        required: true
    },
    role: {
        type: Schema.Types.String,
        required: true,
        enum: ['student', 'instructor', 'admin']
    },
    info: {
        type: UserInfoSchema,
        required: true
    }


}, { timestamps: true })

export const UserModel = model<IUserDocument>('users', UserSchema)