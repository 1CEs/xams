import { UpdateWriteOpResult } from "mongoose"
import { CategoryPayload } from "../../../../types/user"
export interface IInstructorService {
    updateExam: (instructor_id: string, examination_id: string) => Promise<UpdateWriteOpResult>
    updateCategory: (instructor_id: string, payload: CategoryPayload) => Promise<UpdateWriteOpResult> 
}