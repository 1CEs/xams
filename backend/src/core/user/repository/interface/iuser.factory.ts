import { IInstructor } from "../../model/interface/iintructor";
import { IStudent } from "../../model/interface/istudent";

export interface IUserRepoFactory<T extends (IInstructor | IStudent)> {
    createRepository: () => T
}