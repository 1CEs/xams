import { AdminRepository } from "../core/user/repository/admin-repo";
import { InstructorRepository } from "../core/user/repository/instructor-repo";
import { StudentRepository } from "../core/user/repository/student-repo";
import { instructorModel, studentModel, adminModel } from "../models/user";
import { IInstructor } from "../models/interface/user/instructor";
import { IStudent } from "../models/interface/user/student";
import { IUser } from "../models/interface/user/user";
import { InstructorService } from "../core/user/service/instructor.service";
import { StudentService } from "../core/user/service/student.service";
import { AdminService } from "../core/user/service/admin.service";

type UserModelType = typeof instructorModel | typeof studentModel | typeof adminModel
type UserRepoType = InstructorRepository | StudentRepository | AdminRepository
type UserServiceType = InstructorService | StudentService | AdminService
type UserType = 'instructor' | 'student' | 'admin'
type UserPayloadType = IUser | IInstructor | IStudent
type UserQueryType = UserPayloadType