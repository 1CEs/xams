import { IUserServiceFactory } from "../interface/service/user";
import { UserServiceType, UserType } from "../../../types/user";
import { StudentService } from "./student.service";
import { InstructorService } from "./instructor.service";
import { AdminService } from "./admin.service";
import { UserRepoFactory } from "../repository/user-repo";
import { StudentRepository } from "../repository/student-repo";
import { InstructorRepository } from "../repository/instructor-repo";
import { AdminRepository } from "../repository/admin-repo";

export class UserServiceFactory implements IUserServiceFactory {
    private repoFactory: UserRepoFactory;
  
    constructor() {
      this.repoFactory = new UserRepoFactory
    }
  
    createService(user: UserType): UserServiceType {
      switch (user) {
        case 'student':
          return new StudentService(this.repoFactory.createRepository('student') as StudentRepository);
        case 'instructor':
          return new InstructorService(this.repoFactory.createRepository('instructor') as InstructorRepository);
        case 'admin':
          return new AdminService(this.repoFactory.createRepository('admin') as AdminRepository);
        default:
          throw new Error('Invalid user type');
      }
    }
  }

