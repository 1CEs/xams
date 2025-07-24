import { IExamSubmission, ISubmittedAnswer } from "../../model/interface/iexam-submission";

export interface IExamSubmissionService {
    submitExam(submissionData: {
        scheduleId: string;
        studentId: string;
        courseId: string;
        groupId: string;
        submittedAnswers: ISubmittedAnswer[];
        timeTaken?: number;
    }): Promise<IExamSubmission>;
    
    getSubmissionById(id: string): Promise<IExamSubmission | null>;
    getStudentSubmissions(studentId: string): Promise<IExamSubmission[]>;
    getScheduleSubmissions(scheduleId: string): Promise<IExamSubmission[]>;
    getStudentSubmissionForSchedule(scheduleId: string, studentId: string): Promise<IExamSubmission | null>;
    
    gradeSubmission(submissionId: string, gradedBy: string): Promise<IExamSubmission | null>;
    manualGradeQuestion(submissionId: string, questionId: string, scoreObtained: number, isCorrect: boolean, gradedBy: string): Promise<IExamSubmission | null>;
    updateSubmissionStatus(submissionId: string, status: 'submitted' | 'graded' | 'reviewed'): Promise<IExamSubmission | null>;
    
    getStudentAttemptCount(scheduleId: string, studentId: string): Promise<number>;
    canStudentAttemptExam(scheduleId: string, studentId: string, allowedAttempts: number): Promise<boolean>;
    
    deleteSubmission(id: string): Promise<boolean>;
}
