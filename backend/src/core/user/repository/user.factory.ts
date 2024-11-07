import { UserRole } from "../../../types/user"
import { InstructorRepository } from "./instructor.repository"
import { IUserRepoFactory } from "./interface/iuser.factory"
import { StudentRepository } from "./student.repository"
import { UserRepository } from "./user.repository"
export class UserRepoFactory implements IUserRepoFactory {
    createRepository(role: UserRole) {
        switch(role) {
            case 'general':
                return new UserRepository()
            case 'instructor':
                return new InstructorRepository()
            case 'student':
                return new StudentRepository()
            case 'admin':
                return new UserRepository()
            default:
                return new UserRepository()
        }
    }
}