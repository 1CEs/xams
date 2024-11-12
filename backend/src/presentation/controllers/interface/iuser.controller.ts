import { IInstructor } from "../../../core/user/model/interface/iintructor";
import { IStudent } from "../../../core/user/model/interface/istudent";
import { IUser } from "../../../core/user/model/interface/iuser";

export interface IUserController {
    // Generally controller methods
    getUsers: () => Promise<ControllerResponse<any>>
    getUser: (id: string) => Promise<ControllerResponse<any>>
    updateUser: (id: string, payload: Partial<IUser>) => Promise<ControllerResponse<any>>
    deleteUser: (id: string) => Promise<ControllerResponse<any>>
    
    // Instructor-Only methods
    updateCategory: (id: string, detail: any) => Promise<any>
    updateExamBank: (id: string, detail: any) => Promise<any>

    // Student-Only methods
}