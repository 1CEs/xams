import { Document, ObjectId } from "mongoose"

export interface IUser extends Document {
    _id: ObjectId
    email: string
    username: string
    password: string
    profile_url: string
    bio?: string
    role: UserRole
    info: {
        first_name: string
        last_name: string
        birth: Date
    }
}