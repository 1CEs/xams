import { IStudentDocument } from "../../../types/user"
import { BaseRepository } from "../../base/base.repository"
import { StudentModel } from "../model/student.model"
import { IStudentRepository } from "./interface/istudent.repository"

export class StudentRepository 
        extends BaseRepository<IStudentDocument> 
        implements IStudentRepository {

            constructor() {
                super(StudentModel)
            }

}