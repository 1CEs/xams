import { ObjectId } from "mongoose"
import { UserRole } from "../../../../types/user"

export interface IUser {
    _id?: ObjectId
    email: string
    username: string
    password: string
    profile_url: string
    bio?: string
    role: UserRole
    status?: {
        is_banned: boolean
        ban_until?: Date
        ban_reason?: string
    }
    info: {
        first_name: string
        last_name: string
    }
}