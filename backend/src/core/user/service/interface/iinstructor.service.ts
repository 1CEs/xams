import { IUserService } from "./iuser.service";

export interface IInstructorService<T> extends IUserService<T>{
    addExam: (_id: string) => Promise<T> 
}