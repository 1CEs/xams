import { UpdateWriteOpResult } from "mongoose"
import { IBaseRepository } from "../../../base/interface/ibase.repository"
import { IInstructor } from "../../model/interface/iintructor"

export interface IInstructorRepository extends IBaseRepository<IInstructor>{
    // Implements instructor logic.
    updateExamination: (instructor_id: string, examination_id: string) => Promise<UpdateWriteOpResult> 
}