import { UserRole } from "../../../types/user";
import { InstructorService } from "./instructor.service";
import { IUserServiceFactory } from "./interface/iuser.factory";
import { StudentService } from "./student.service";
import { UserService } from "./user.service";

export class UserServiceFactory implements IUserServiceFactory {
    createService(role: UserRole) {
        switch(role) {
            case 'general': 
                return new UserService(role)
            case 'instructor':
                return new InstructorService(role)
            case 'student':
                return new StudentService(role)
            case 'admin':
                return new UserService(role)
            default:
                return new UserService(role)
        }
    }
}