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
}