import mongoose from "mongoose"
import { IUser } from "./interface/iuser"

const { Schema, model } = mongoose

const UserInfoSchema = new Schema<IUser['info']>({
    first_name: {
        type: Schema.Types.String,
        required: true
    },
    last_name: {
        type: Schema.Types.String,
        required: true
    },
    birth: {
        type: Schema.Types.Date,
        required: true
    }
})

const UserSchema = new Schema<IUser>({
    _id: { type: Schema.Types.ObjectId },
    username: {
        type: Schema.Types.String,
        required: true
    },
    email: {
        type: Schema.Types.String,
        required: true
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

export const UserModel = model('users', UserSchema)