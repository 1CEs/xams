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

            async addSubmissionId(studentId: string, submissionId: string): Promise<boolean> {
                try {
                    const result = await StudentModel.findByIdAndUpdate(
                        studentId,
                        { $addToSet: { submission_ids: submissionId } },
                        { new: true }
                    );
                    return !!result;
                } catch (error) {
                    console.error('Error adding submission ID to student:', error);
                    return false;
                }
            }

            async removeSubmissionId(studentId: string, submissionId: string): Promise<boolean> {
                try {
                    const result = await StudentModel.findByIdAndUpdate(
                        studentId,
                        { $pull: { submission_ids: submissionId } },
                        { new: true }
                    );
                    return !!result;
                } catch (error) {
                    console.error('Error removing submission ID from student:', error);
                    return false;
                }
            }

}