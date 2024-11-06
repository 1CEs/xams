import { IBaseRepository } from "../../../base/interface/ibase.repository"
import { IStudent } from "../../model/interface/istudent"

export interface IStudentRepository extends IBaseRepository<IStudent>{
    // Implements student logic here.
}