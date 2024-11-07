import { Document } from "mongoose"
import { UserRepositoryType, UserRole } from "../../../types/user"
import { IInstructor } from "../model/interface/iintructor"
import { IStudent } from "../model/interface/istudent"
import { IUser } from "../model/interface/iuser"
import { UserRepoFactory } from "../repository/user.factory"
import { UserRepository } from "../repository/user.repository"
import { IUserService } from "./interface/iuser.service"

export class UserService<T extends IUser | IStudent | IInstructor> implements IUserService<T> {
    protected _repository: UserRepositoryType

    constructor(role: UserRole) {
        const factory = new UserRepoFactory()
        this._repository = factory.createRepository(role)
    }

    async register(payload: Partial<T>) {
        if (!payload.email || !payload.username || !payload.password) {
            throw new Error("Email, username, and password are required fields.")
        }

        const [userFromEmail, userFromUsername] = await Promise.all([
            this.getUserByEmail(payload.email),
            this.getUserByUsername(payload.username)
        ])

        if (userFromEmail || userFromUsername) {
            throw new Error(
                `User with ${userFromEmail ? 'email' : 'username'} already exists.`
            )
        }

        const hashedPassword = await Bun.password.hash(payload.password, {
            algorithm: 'bcrypt',
            cost: 4,
        })

        const result = await this._repository.save({
            ...payload,
            password: hashedPassword,
        })

        return result as (T & Document | null)
    }

    async getUsers() {
        const result = await this._repository.find()
        return result as T[] | null
    }

    async getUserById(_id: string) {
        const result = await this._repository.findById(_id)
        return result as T | null
    }

    async getUserByEmail(email: string) {
        if (this._repository instanceof UserRepository) {
            const result = await this._repository.findByEmail(email)
            return result as T | null
        }
        return null
    }

    async getUserByUsername(username: string) {
        if (this._repository instanceof UserRepository) {
            const result = await this._repository.findByUsername(username)
            return result as T | null
        }
        return null
    }

    async updateUser(_id: string, payload: Partial<T>) {
        const result = await this._repository.update(_id, payload)
        return result as T | null
    }

    async deleteUser(_id: string) {
        const result = await this._repository.delete(_id)
        return result as T | null
    }
}
