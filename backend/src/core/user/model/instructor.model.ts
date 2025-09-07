import mongoose from "mongoose"
import { UserModel } from "./user.model"
import { IInstructorDocument } from "../../../types/user"

const { Schema } = mongoose

const InstructorSchema = new Schema<IInstructorDocument>({
    bank: {
        type: [Schema.Types.ObjectId],
        ref: 'banks'
    },
    courses: {
        type: [Schema.Types.ObjectId],
        ref: 'courses'
    }
})

export const InstructorModel = UserModel.discriminator<IInstructorDocument>('instructor', InstructorSchema)