import { UpdateWriteOpResult } from "mongoose";
import { IInstructor } from "../../../core/user/model/interface/iintructor";
import { IStudent } from "../../../core/user/model/interface/istudent";
import { IUser } from "../../../core/user/model/interface/iuser";
import { CategoryPayload } from "../../../types/user";

export interface IUserController {
    // Generally controller methods
    getUsers: () => Promise<ControllerResponse<any>>
    getUser: (id: string) => Promise<ControllerResponse<any>>
    updateUser: (id: string, payload: Partial<IUser>) => Promise<ControllerResponse<any>>
    deleteUser: (id: string) => Promise<ControllerResponse<any>>
    
    // Instructor-Only methods
    getCategory: (instructor_id: string) => Promise<ControllerResponse<IInstructor['categories'] | undefined>>
    getBank: (instructor_id: string) => Promise<ControllerResponse<IInstructor['bank'] | undefined>>
    updateCategory: (id: string, payload: CategoryPayload) => Promise<ControllerResponse<UpdateWriteOpResult>>
    updateExamBank: (instructor_id: string, examination_id: string) => Promise<ControllerResponse<UpdateWriteOpResult>>

    // Student-Only methods
}