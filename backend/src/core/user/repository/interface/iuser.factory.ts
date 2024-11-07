import { UserRole } from "../../../../types/user"
import { IInstructorRepository } from "./iinstructor.repository"
import { IStudentRepository } from "./istudent.repository"
import { IUserRepository } from "./iuser.repository"

export interface IUserRepoFactory {
    createRepository: (role: UserRole) => (IUserRepository | IInstructorRepository | IStudentRepository)
}