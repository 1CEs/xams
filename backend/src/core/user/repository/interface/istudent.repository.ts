import { IBaseRepository } from "../../../base/interface/ibase.repository"
import { IStudentDocument } from "../../../../types/user"

export interface IStudentRepository extends IBaseRepository<IStudentDocument>{
    // Implements student logic here.
    addSubmissionId(studentId: string, submissionId: string): Promise<boolean>;
    removeSubmissionId(studentId: string, submissionId: string): Promise<boolean>;
}