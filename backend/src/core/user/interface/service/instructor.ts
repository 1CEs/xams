import { ObjectId } from "mongoose";
import { IInstructor } from "../../../../models/interface/user/instructor";
import { IUserService } from "./user";

export interface IInstructorService extends IUserService {
    // To implement.   
    updateBankService: (instructor_id: string, exam_id: string) => Promise<(Document & IInstructor & { _id: ObjectId })[] | null> 
    updateCategoryService: (instructor_id: string, name: string, color: string) => Promise<(Document & IInstructor & { _id: ObjectId })[] | null>
}