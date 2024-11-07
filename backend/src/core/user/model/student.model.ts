import mongoose from "mongoose"
import { UserModel } from "./user.model"
import { IStudentDocument } from "../../../types/user"

const { Schema } = mongoose

const StudentSchema = new Schema<IStudentDocument>({
    enrolls: {
        type: [Schema.Types.ObjectId]
    },
    exam_attempts: {
        type: [Schema.Types.ObjectId]
    }
})

export const StudentModel = UserModel.discriminator<IStudentDocument>('student', StudentSchema)