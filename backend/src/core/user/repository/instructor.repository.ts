import { CategoryPayload, IInstructorDocument } from "../../../types/user";
import { BaseRepository } from "../../base/base.repository";
import { InstructorModel } from "../model/instructor.model";
import { IInstructorRepository } from "./interface/iinstructor.repository";

export class InstructorRepository 
        extends BaseRepository<IInstructorDocument> 
        implements IInstructorRepository {

    constructor() {
        super(InstructorModel)
    }

    async getCategory (instructor_id: string) {
        const result = await this._model.findById(instructor_id).exec()
        return result?.categories
    }
    
    async updateExamination(instructor_id: string, examination_id: string) {
        const result = await this._model.updateOne(
            { _id: instructor_id }, 
            { $push: { exam_bank: examination_id } }
        ).exec()
        return result
    }

    async updateCourse(instructor_id: string, course_id: string) {
        const result = await this._model.updateOne(
            { _id: instructor_id }, 
            { $push: { courses: course_id } }
        ).exec()
        return result
    }

    async updateCategory(instructor_id: string, category: CategoryPayload) {
        const result = await this._model.updateOne(
            { _id: instructor_id },
            { $push: { categories: category } }
        )
        return result
    }

}