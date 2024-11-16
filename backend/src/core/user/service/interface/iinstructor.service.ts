import { UpdateWriteOpResult } from "mongoose"
import { CategoryPayload } from "../../../../types/user"
import { IInstructor } from "../../model/interface/iintructor"
export interface IInstructorService {
    getCategory: (instructor_id: string) => Promise<IInstructor['categories'] | undefined>
    updateExam: (instructor_id: string, examination_id: string) => Promise<UpdateWriteOpResult>
    updateCategory: (instructor_id: string, payload: CategoryPayload) => Promise<UpdateWriteOpResult> 
}