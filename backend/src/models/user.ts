import mongoose from "mongoose";
import { IInstructor } from "./interface/user/instructor";
import { IStudent } from "./interface/user/student";
import { Role } from "../constants/enums/role";
import { IUser } from "./interface/user/user";

const { Schema, model } = mongoose

export const UserSchema = new Schema<IUser>({
    email: {
        type: Schema.Types.String,
        unique: true,
        required: true
    },
    username: {
        type: Schema.Types.String,
        unique: true,
        required: true
    },
    password: {
        type: Schema.Types.String,
        required: true
    },
    bio: {
        type: Schema.Types.String,
        maxlength: 1000,
        required: true
    },
    profile_url: {
        type: Schema.Types.String,
        default: "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png"
    },
    role: {
        type: Schema.Types.String,
        enum: Object.values(Role),
        required: true
    },
    info: {
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
    },
    refresh_token: {
        type: Schema.Types.String,
        required: true
    }
}, { timestamps: true })

export const StudentSchema = new Schema<IStudent>({
    join_groups: { type: [Schema.Types.ObjectId] },
    exam_attempts: { type: [Schema.Types.ObjectId] }
}, { collection: 'students', timestamps: true})

export const instructorSchema = new Schema<IInstructor>({
    courses: { type: [Schema.Types.ObjectId] },
    exam_bank: { type: [Schema.Types.ObjectId] }
}, { collection: 'instructors', timestamps: true })

StudentSchema.add(UserSchema)
instructorSchema.add(UserSchema)

export const studentModel = model('students', StudentSchema)
export const instructorModel = model('instructors', instructorSchema)
export const adminModel = model('moderators', UserSchema)