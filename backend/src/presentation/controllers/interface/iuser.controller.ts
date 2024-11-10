import { IInstructor } from "../../../core/user/model/interface/iintructor";
import { IStudent } from "../../../core/user/model/interface/istudent";
import { IUser } from "../../../core/user/model/interface/iuser";

export interface IUserController {
    // Generally controller methods
    getUsers: () => Promise<(IUser | IStudent | IInstructor)[] | null>
    getUser: (id: string) => Promise<(IUser | IStudent | IInstructor) | null>
    updateUser: (id: string, payload: Partial<IUser>) => Promise<(IUser | IStudent | IInstructor) | null>
    deleteUser: (id: string) => Promise<(IUser | IStudent | IInstructor) | null>
    
    // Instructor-Only methods
    updateCategory: (id: string, detail: any) => Promise<any>
    updateExamBank: (id: string, detail: any) => Promise<any>

    // Student-Only methods
}