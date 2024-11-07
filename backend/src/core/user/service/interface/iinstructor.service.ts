import { UpdateWriteOpResult } from "mongoose"
export interface IInstructorService {
    updateExam: (instructor_id: string, examination_id: string) => Promise<UpdateWriteOpResult> 
}