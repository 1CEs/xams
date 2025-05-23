import { UpdateWriteOpResult } from "mongoose"
import { IBaseRepository } from "../../../base/interface/ibase.repository"
import { IInstructor } from "../../model/interface/iintructor"
import { CategoryPayload } from "../../../../types/user"

export interface IInstructorRepository extends IBaseRepository<IInstructor>{
    // Implements instructor logic.
    getCategory: (instructor_id: string) => Promise<IInstructor['categories'] | undefined>
    updateExamination: (instructor_id: string, examination_id: string) => Promise<UpdateWriteOpResult>
    updateCourse: (instructor_id: string, course_id: string) => Promise<UpdateWriteOpResult>
    updateCategory: (instructor_id: string, category: CategoryPayload) => Promise<UpdateWriteOpResult>
}