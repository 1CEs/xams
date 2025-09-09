import { UpdateWriteOpResult } from "mongoose"
import { CategoryPayload } from "../../../../types/user"
import { IInstructor } from "../../model/interface/iintructor"
export interface IInstructorService {
    getBank: (instructor_id: string) => Promise<IInstructor['bank'] | undefined>
    updateExam: (instructor_id: string, examination_id: string) => Promise<UpdateWriteOpResult>
    updateBank: (instructor_id: string, bank_id: string) => Promise<UpdateWriteOpResult>
    updateCourse: (instructor_id: string, course_id: string) => Promise<UpdateWriteOpResult>
    updateCategory: (instructor_id: string, payload: CategoryPayload) => Promise<UpdateWriteOpResult> 
}