import { CategoryPayload, UserRole } from "../../../types/user";
import { IInstructor } from "../model/interface/iintructor";
import { InstructorRepository } from "../repository/instructor.repository";
import { IInstructorService } from "./interface/iinstructor.service";
import { UserService } from "./user.service";

export class InstructorService extends UserService<IInstructor> implements IInstructorService {
    constructor(role: UserRole) {
        super(role)
    }

    async updateExam(instructor_id: string, examination_id: string) {
        const result = await (this._repository as InstructorRepository).updateExamination(instructor_id, examination_id)
        return result
    }

    async updateCategory(instructor_id: string, payload: CategoryPayload) {
        const result = await (this._repository as InstructorRepository).updateCategory(instructor_id, payload)
        return result
    }
}