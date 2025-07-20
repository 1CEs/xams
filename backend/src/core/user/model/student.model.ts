import mongoose from "mongoose"
import { UserModel } from "./user.model"
import { IStudentDocument } from "../../../types/user"

const { Schema } = mongoose

const StudentSchema = new Schema<IStudentDocument>({
    join_groups: {
        type: [Schema.Types.ObjectId]
    },
    exam_attempts: {
        type: [Schema.Types.ObjectId]
    },
    submission_ids: {
        type: [Schema.Types.ObjectId],
        default: []
    }
})

export const StudentModel = UserModel.discriminator<IStudentDocument>('student', StudentSchema)