import { UpdateWriteOpResult } from "mongoose";
import { IUser } from "../../core/user/model/interface/iuser";
import { InstructorService } from "../../core/user/service/instructor.service";
import { IUserServiceFactory } from "../../core/user/service/interface/iuser.factory";
import { UserServiceFactory } from "../../core/user/service/user.factory";
import { CategoryPayload } from "../../types/user";
import { IUserController } from "./interface/iuser.controller";
import { IInstructor } from "../../core/user/model/interface/iintructor";
import { JWT } from "../middleware/jwt.middleware";

type JWTInstance = {
    sign: (payload: any) => Promise<string>
    verify: (token: string) => Promise<any>
}

export class UserController implements IUserController {
    private _factory: IUserServiceFactory

    constructor() {
        this._factory = new UserServiceFactory()
    }

    private _response<T>(message: string, code: number, data: T) {
        return {
            message,
            code,
            data
        }
    }

    // Generally controller methods
    async getUsers() {
        const users = await this._factory.createService('general').getUsers()
        return this._response<typeof users>('Done', 200, users)
    }

    async getUser(id: string) {
        const user = await this._factory.createService('general').getUserById(id)
        return this._response<typeof user>('Done', 200, user)
    }

    async updateUser(id: string, payload: Partial<IUser>) {
        const updated = await this._factory.createService('general').updateUser(id, payload)
        return this._response<typeof updated>('Update Successfully', 200, updated)
    }

    async deleteUser(id: string) {
        const deleted = await this._factory.createService('general').deleteUser(id)
        return this._response<typeof deleted>('Delete Successfully', 200, deleted)
    }

    async forgotPassword(email: string, jwt: JWTInstance) {
        const result = await this._factory.createService('general').forgotPassword(email, jwt)
        return this._response<typeof result>('Password reset email sent successfully', 200, result)
    }

    // Instructor-Only methods
    async getCategory (instructor_id: string) {
        const categories = await (this._factory.createService('instructor') as InstructorService).getCategory(instructor_id)
        return this._response<typeof categories>('Done', 200, categories)
    }

    async updateCategory(id: string, payload: CategoryPayload) {
        const updated = await (this._factory.createService('instructor') as InstructorService).updateCategory(id, payload)
        return this._response<UpdateWriteOpResult>('Update Category Successfully', 200, updated)
    }

    async updateExamBank(instructor_id: string, examination_id: string) {
        const updated = await (this._factory.createService('instructor') as InstructorService).updateExam(instructor_id, examination_id)
        return this._response<UpdateWriteOpResult>('Update Examination Bank Successfully', 200, updated)
    }

    // Student-Only methods

}