import mongoose from "mongoose"
import { IInstructor } from "./interface/iintructor"
import { UserModel } from "./user.model"
import { IUser } from "./interface/iuser"
import { IInstructorDocument } from "../../../types/user"

const { Schema } = mongoose

const CategoriesSchema = new Schema<IInstructor['categories']>({
    _id: { type: Schema.Types.ObjectId },
    name: {
        type: Schema.Types.String,
        required: true
    },
    color: {
        type: Schema.Types.String,
        required: true
    }
})

const InstructorSchema = new Schema<IInstructorDocument>({
    categories: [CategoriesSchema],
    exam_bank: {
        type: [Schema.Types.ObjectId],
        ref: 'examinations'
    },
    courses: {
        type: [Schema.Types.ObjectId],
        ref: 'courses'
    }
})

export const InstructorModel = UserModel.discriminator<IInstructorDocument>('instructor', InstructorSchema)