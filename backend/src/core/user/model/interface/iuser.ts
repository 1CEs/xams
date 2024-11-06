import { ObjectId } from "mongoose"
import { UserRole } from "../../../../types/user"

export interface IUser {
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