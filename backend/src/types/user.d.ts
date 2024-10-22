import { AdminRepository } from "../core/user/repository/admin-repo";
import { InstructorRepository } from "../core/user/repository/instructor-repo";
import { StudentRepository } from "../core/user/repository/student-repo";
import { instructorModel, studentModel, adminModel } from "../models/user";
import { IInstructor } from "../models/interface/user/instructor";
import { IStudent } from "../models/interface/user/student";
import { IUser } from "../models/interface/user/user";

type UserModelType = typeof instructorModel | typeof studentModel | typeof adminModel
type UserRepoType = InstructorRepository | StudentRepository | AdminRepository
type UserType = 'instructor' | 'student' | 'admin'
type UserPayloadType = IUser | IInstructor | IStudent
type UserQueryType = UserPayloadType