import { Document } from "mongoose"
import { IUser } from "../core/user/model/interface/iuser"
import { IInstructor } from "../core/user/model/interface/iintructor"
import { IStudent } from "../core/user/model/interface/istudent"
import { InstructorRepository } from "../core/user/repository/instructor.repository"
import { StudentRepository } from "../core/user/repository/student.repository"
import { UserRepository } from "../core/user/repository/user.repository"
import { UserService } from "../core/user/service/user.service"
import { InstructorService } from "../core/user/service/instructor.service"
import { StudentService } from "../core/user/service/student.service"

declare type UserRole = 'student' | 'instructor' | 'admin' | 'general'
declare type IUserDocument = IUser & Document
declare type IInstructorDocument = IInstructor & Document
declare type IStudentDocument = IStudent & Document
declare type UserRepositoryType = InstructorRepository | StudentRepository | UserRepository
declare type UserServiceType = UserService<IUser> | InstructorService | StudentService
declare type SignUpPayload = Omit<IUser, '_id'>
declare type SignInPayload = {
    identifier: string,
    password: string
}