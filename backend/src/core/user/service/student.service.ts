import { UserRole } from "../../../types/user";
import { IStudent } from "../model/interface/istudent";
import { IStudentService } from "./interface/istudent.service";
import { UserService } from "./user.service";

export class StudentService extends UserService<IStudent> implements IStudentService {
    constructor(role: UserRole) {
        super(role)
    }

    async isUserAlreadyInGroup(user_id: string, group_id: string): Promise<boolean> {
        const student = await this._repository.findById(user_id, { join_groups: 1 }) as IStudent | null;

        if (!student) {
            return false;
        }

        return student.join_groups.some(id => id.toString() === group_id);
    }
}