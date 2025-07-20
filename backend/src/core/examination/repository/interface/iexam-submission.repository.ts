import { IExamSubmission } from "../../model/interface/iexam-submission";

export interface IExamSubmissionRepository {
    createSubmission(submission: IExamSubmission): Promise<IExamSubmission>;
    getSubmissionById(id: string): Promise<IExamSubmission | null>;
    getSubmissionsByStudentId(studentId: string): Promise<IExamSubmission[]>;
    getSubmissionsByScheduleId(scheduleId: string): Promise<IExamSubmission[]>;
    getSubmissionByScheduleAndStudent(scheduleId: string, studentId: string, attemptNumber?: number): Promise<IExamSubmission | null>;
    updateSubmission(id: string, updates: Partial<IExamSubmission>): Promise<IExamSubmission | null>;
    deleteSubmission(id: string): Promise<boolean>;
    getStudentAttemptCount(scheduleId: string, studentId: string): Promise<number>;
    getSubmissionsByStatus(status: 'submitted' | 'graded' | 'reviewed'): Promise<IExamSubmission[]>;
}
