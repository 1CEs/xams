import { IUser } from "../../core/user/model/interface/iuser";
import { InstructorService } from "../../core/user/service/instructor.service";
import { IUserServiceFactory } from "../../core/user/service/interface/iuser.factory";
import { UserServiceFactory } from "../../core/user/service/user.factory";
import { CategoryPayload } from "../../types/user";
import { IUserController } from "./interface/iuser.controller";

export class UserController implements IUserController {
    private _factory: IUserServiceFactory

    constructor() {
        this._factory = new UserServiceFactory()
    }

    // Generally controller methods
    async getUsers() {
        return await this._factory.createService('general').getUsers()
    }

    async getUser(id: string) {
        return await this._factory.createService('general').getUserById(id)
    }

    async updateUser(id: string, payload: Partial<IUser>) {
        return await this._factory.createService('general').updateUser(id, payload)
    }

    async deleteUser(id: string) {
        return await this._factory.createService('general').deleteUser(id)
    }

    // Instructor-Only methods
    async updateCategory(id: string, payload: CategoryPayload) {
        return await (this._factory.createService('instructor') as InstructorService).updateCategory(id, payload)
    }

    async updateExamBank(instructor_id: string, examination_id: string) {
        return await (this._factory.createService('instructor') as InstructorService).updateExam(instructor_id, examination_id)
    }

    // Student-Only methods

}