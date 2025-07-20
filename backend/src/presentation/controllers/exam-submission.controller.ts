import { ExamSubmissionService } from "../../core/examination/service/exam-submission.service";
import { ISubmittedAnswer } from "../../core/examination/model/interface/iexam-submission";

export class ExamSubmissionController {
    private _service: ExamSubmissionService;

    constructor() {
        this._service = new ExamSubmissionService();
    }

    async submitExam(body: {
        schedule_id: string;
        student_id: string;
        course_id: string;
        group_id: string;
        submitted_answers: ISubmittedAnswer[];
        time_taken?: number;
    }) {
        try {
            const submission = await this._service.submitExam({
                scheduleId: body.schedule_id,
                studentId: body.student_id,
                courseId: body.course_id,
                groupId: body.group_id,
                submittedAnswers: body.submitted_answers,
                timeTaken: body.time_taken
            });

            return {
                success: true,
                message: 'Exam submitted successfully',
                data: submission
            };
        } catch (error) {
            console.error('Error in submitExam controller:', error);
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Failed to submit exam',
                data: null
            };
        }
    }

    async getSubmission(submissionId: string) {
        try {
            const submission = await this._service.getSubmissionById(submissionId);
            
            if (!submission) {
                return {
                    success: false,
                    message: 'Submission not found',
                    data: null
                };
            }

            return {
                success: true,
                message: 'Submission retrieved successfully',
                data: submission
            };
        } catch (error) {
            console.error('Error in getSubmission controller:', error);
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Failed to get submission',
                data: null
            };
        }
    }

    async getStudentSubmissions(studentId: string) {
        try {
            const submissions = await this._service.getStudentSubmissions(studentId);

            return {
                success: true,
                message: 'Student submissions retrieved successfully',
                data: submissions
            };
        } catch (error) {
            console.error('Error in getStudentSubmissions controller:', error);
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Failed to get student submissions',
                data: []
            };
        }
    }

    async getScheduleSubmissions(scheduleId: string) {
        try {
            const submissions = await this._service.getScheduleSubmissions(scheduleId);

            return {
                success: true,
                message: 'Schedule submissions retrieved successfully',
                data: submissions
            };
        } catch (error) {
            console.error('Error in getScheduleSubmissions controller:', error);
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Failed to get schedule submissions',
                data: []
            };
        }
    }

    async getStudentAttemptCount(scheduleId: string, studentId: string) {
        try {
            const count = await this._service.getStudentAttemptCount(scheduleId, studentId);

            return {
                success: true,
                message: 'Attempt count retrieved successfully',
                data: { count }
            };
        } catch (error) {
            console.error('Error in getStudentAttemptCount controller:', error);
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Failed to get attempt count',
                data: { count: 0 }
            };
        }
    }

    async canStudentAttemptExam(scheduleId: string, studentId: string, allowedAttempts: number) {
        try {
            const canAttempt = await this._service.canStudentAttemptExam(scheduleId, studentId, allowedAttempts);

            return {
                success: true,
                message: 'Attempt eligibility checked successfully',
                data: { canAttempt }
            };
        } catch (error) {
            console.error('Error in canStudentAttemptExam controller:', error);
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Failed to check attempt eligibility',
                data: { canAttempt: false }
            };
        }
    }

    async gradeSubmission(submissionId: string, gradedBy: string) {
        try {
            const gradedSubmission = await this._service.gradeSubmission(submissionId, gradedBy);

            if (!gradedSubmission) {
                return {
                    success: false,
                    message: 'Failed to grade submission',
                    data: null
                };
            }

            return {
                success: true,
                message: 'Submission graded successfully',
                data: gradedSubmission
            };
        } catch (error) {
            console.error('Error in gradeSubmission controller:', error);
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Failed to grade submission',
                data: null
            };
        }
    }
}
