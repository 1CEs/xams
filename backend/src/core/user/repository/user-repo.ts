import { IUserRepoFactory } from "../interface/repository/user";
import { StudentRepository } from "./student-repo";
import { AdminRepository } from "./admin-repo";
import { InstructorRepository } from "./instructor-repo";
import { UserType } from "../../../types/user";

export class UserRepoFactory implements IUserRepoFactory {
    createRepository(type: UserType) {
        switch (type) {
            case 'instructor':
                return new InstructorRepository();
            case 'student':
                return new StudentRepository();
            case 'admin':
                return new AdminRepository();
            default:
                throw new Error('Invalid user type');
        }
    }
}