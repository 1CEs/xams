import { UpdateWriteOpResult } from "mongoose"
import { IBaseRepository } from "../../../base/interface/ibase.repository"
import { IInstructor } from "../../model/interface/iintructor"
import { CategoryPayload, IInstructorDocument } from "../../../../types/user"

export interface IInstructorRepository extends IBaseRepository<IInstructorDocument>{
    // Implements instructor logic.
    getBank: (instructor_id: string) => Promise<IInstructor['bank'] | undefined>
    updateExamination: (instructor_id: string, examination_id: string) => Promise<UpdateWriteOpResult>
    updateBank: (instructor_id: string, bank_id: string) => Promise<UpdateWriteOpResult>
    updateCourse: (instructor_id: string, course_id: string) => Promise<UpdateWriteOpResult>
    updateCategory: (instructor_id: string, category: CategoryPayload) => Promise<UpdateWriteOpResult>
}