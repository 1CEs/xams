import { IInstructor } from "../../../core/user/model/interface/iintructor";
import { IStudent } from "../../../core/user/model/interface/istudent";
import { IUser } from "../../../core/user/model/interface/iuser";

export interface IUserController {
    // Generally controller methods
    getUsers: () => Promise<(IUser | IStudent | IInstructor)[] | null>
    getUser: (id: string) => Promise<(IUser | IStudent | IInstructor) | null>
    updateUser: (id: string) => Promise<(IUser | IStudent | IInstructor) | null>
    deleteUser: (id: string) => Promise<(IUser | IStudent | IInstructor) | null>
    
    // Only-Instructor methods
    updateCategory: (id: string, detail: any) => Promise<any>
}