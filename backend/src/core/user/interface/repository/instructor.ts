import { ObjectId } from "mongoose";
import { IInstructor } from "../../../../models/interface/user/instructor";
import { IUserRepository } from "./user";

export interface IInstructorRepository extends IUserRepository {
    // To implement.   
    updateBank: (instructor_id: string, exam_id: string) => Promise<(Document & IInstructor & { _id: ObjectId })[] | null>
    updateCategory: (instructor_id: string, name: string, color: string) => Promise<(Document & IInstructor & { _id: ObjectId })[] | null>
    deleteCategory: (instructor_id: string, category_id: string) => Promise<(Document & IInstructor & { _id: ObjectId })[] | null>
}