import { UserRole } from "../../../types/user";
import { IStudent } from "../model/interface/istudent";
import { IStudentService } from "./interface/istudent.service";
import { UserService } from "./user.service";

export class StudentService extends UserService<IStudent> implements IStudentService {
    constructor(role: UserRole) {
        super(role)
    }
}