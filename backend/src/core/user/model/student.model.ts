import mongoose from "mongoose";
import { IStudent } from "./interface/istudent";
import { UserModel } from "./user.model";
import { IUser } from "./interface/iuser";

const { Schema } = mongoose

const StudentSchema = new Schema<IStudent>({
    enrolls: {
        type: [Schema.Types.ObjectId]
    },
    exam_attempts: {
        type: [Schema.Types.ObjectId]
    }
})

export const StudentModel = UserModel.discriminator<IUser & IStudent>('student', StudentSchema)