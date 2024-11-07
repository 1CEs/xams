import { UpdateWriteOpResult } from "mongoose";
import { IInstructorDocument } from "../../../types/user";
import { BaseRepository } from "../../base/base.repository";
import { InstructorModel } from "../model/instructor.model";
import { IInstructorRepository } from "./interface/iinstructor.repository";

export class InstructorRepository 
        extends BaseRepository<IInstructorDocument> 
        implements IInstructorRepository {

    constructor() {
        super(InstructorModel)
    }
    
    async updateExamination(instructor_id: string, examination_id: string) {
        const result = await this._model.updateOne(
            {_id: instructor_id}, 
            { $push: { exams: examination_id }}
        ).exec()
        return result
    }

}