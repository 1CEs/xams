import { IExamSubmissionRepository } from "./interface/iexam-submission.repository";
import { IExamSubmission } from "../model/interface/iexam-submission";
import { ExamSubmissionModel } from "../model/exam-submission.model";
import { UserModel } from "../../user/model/user.model";

export class ExamSubmissionRepository implements IExamSubmissionRepository {
    
    async createSubmission(submission: IExamSubmission): Promise<IExamSubmission> {
        try {
            console.log('Create submission');
            const newSubmission = new ExamSubmissionModel(submission);
            const savedSubmission = await newSubmission.save();
            console.log('Saved submission:', savedSubmission.toObject());
            return savedSubmission.toObject();
        } catch (error) {
            console.error('Error creating exam submission:', error);
            throw new Error('Failed to create exam submission');
        }
    }

    async getSubmissionById(id: string): Promise<IExamSubmission | null> {
        try {
            const submission = await ExamSubmissionModel.findById(id).lean();
            return submission;
        } catch (error) {
            console.error('Error getting submission by ID:', error);
            throw new Error('Failed to get submission');
        }
    }

    async getSubmissionsByStudentId(studentId: string): Promise<IExamSubmission[]> {
        try {
            const submissions = await ExamSubmissionModel
                .find({ student_id: studentId })
                .sort({ created_at: -1 })
                .lean();
            return submissions;
        } catch (error) {
            console.error('Error getting submissions by student ID:', error);
            throw new Error('Failed to get student submissions');
        }
    }

    async getSubmissionsByScheduleId(scheduleId: string): Promise<any[]> {
        try {
            const submissions = await ExamSubmissionModel
                .find({ schedule_id: scheduleId })
                .sort({ created_at: -1 })
                .lean();

            // Populate student information for each submission
            const submissionsWithStudentInfo = await Promise.all(
                submissions.map(async (submission) => {
                    try {
                        const student = await UserModel.findById(submission.student_id)
                            .select('username email profile_url')
                            .lean();
                        
                        return {
                            ...submission,
                            student_info: student ? {
                                username: student.username,
                                email: student.email,
                                profile_url: student.profile_url
                            } : null
                        };
                    } catch (error) {
                        console.error(`Error fetching student info for ${submission.student_id}:`, error);
                        return {
                            ...submission,
                            student_info: null
                        };
                    }
                })
            );

            return submissionsWithStudentInfo;
        } catch (error) {
            console.error('Error getting submissions by schedule ID:', error);
            throw new Error('Failed to get schedule submissions');
        }
    }

    async getSubmissionByScheduleAndStudent(
        scheduleId: string, 
        studentId: string, 
        attemptNumber?: number
    ): Promise<IExamSubmission | null> {
        try {
            const query: any = { schedule_id: scheduleId, student_id: studentId };
            if (attemptNumber) {
                query.attempt_number = attemptNumber;
            }
            
            const submission = await ExamSubmissionModel
                .findOne(query)
                .sort({ attempt_number: -1 }) // Get latest attempt if no specific attempt number
                .lean();
            return submission;
        } catch (error) {
            console.error('Error getting submission by schedule and student:', error);
            throw new Error('Failed to get submission');
        }
    }

    async updateSubmission(id: string, updates: Partial<IExamSubmission>): Promise<IExamSubmission | null> {
        try {
            // First check if the submission exists
            const existingSubmission = await ExamSubmissionModel.findById(id).lean();
            if (!existingSubmission) {
                console.error('❌ Repository: Submission not found with ID:', id);
                return null;
            }
            
            const updatedSubmission = await ExamSubmissionModel
                .findByIdAndUpdate(id, updates, { new: true, runValidators: true })
                .lean();
            
            return updatedSubmission;
        } catch (error) {
            console.error('❌ Repository: Error updating submission:', error);
            throw new Error('Failed to update submission');
        }
    }

    async deleteSubmission(id: string): Promise<boolean> {
        try {
            const result = await ExamSubmissionModel.findByIdAndDelete(id);
            return !!result;
        } catch (error) {
            console.error('Error deleting submission:', error);
            throw new Error('Failed to delete submission');
        }
    }

    async deleteSubmissionsByScheduleId(scheduleId: string): Promise<boolean> {
        try {
            console.log(`🗑️ Deleting all submissions for schedule ID: ${scheduleId}`);
            const result = await ExamSubmissionModel.deleteMany({ schedule_id: scheduleId });
            console.log(`✅ Deleted ${result.deletedCount} submissions for schedule ${scheduleId}`);
            return result.deletedCount !== undefined && result.deletedCount >= 0;
        } catch (error) {
            console.error('Error deleting submissions by schedule ID:', error);
            throw new Error('Failed to delete submissions by schedule ID');
        }
    }

    async getStudentAttemptCount(scheduleId: string, studentId: string): Promise<number> {
        try {
            const count = await ExamSubmissionModel.countDocuments({
                schedule_id: scheduleId,
                student_id: studentId
            });
            return count;
        } catch (error) {
            console.error('Error getting student attempt count:', error);
            throw new Error('Failed to get attempt count');
        }
    }

    async getSubmissionsByStatus(status: 'submitted' | 'graded' | 'reviewed'): Promise<IExamSubmission[]> {
        try {
            const submissions = await ExamSubmissionModel
                .find({ status })
                .sort({ created_at: -1 })
                .lean();
            return submissions;
        } catch (error) {
            console.error('Error getting submissions by status:', error);
            throw new Error('Failed to get submissions by status');
        }
    }
}
