import { IExamSubmissionService } from "./interface/iexam-submission.service";
import { IExamSubmission, ISubmittedAnswer } from "../model/interface/iexam-submission";
import { ExamSubmissionRepository } from "../repository/exam-submission.repository";
import { StudentRepository } from "../../user/repository/student.repository";
import { ExaminationScheduleRepository } from "../repository/exam-schedule.repository";

export class ExamSubmissionService implements IExamSubmissionService {
    private _submissionRepository: ExamSubmissionRepository;
    private _studentRepository: StudentRepository;
    private _scheduleRepository: ExaminationScheduleRepository;

    constructor() {
        this._submissionRepository = new ExamSubmissionRepository();
        this._studentRepository = new StudentRepository();
        this._scheduleRepository = new ExaminationScheduleRepository();
    }

    async submitExam(submissionData: {
        scheduleId: string;
        studentId: string;
        courseId: string;
        groupId: string;
        submittedAnswers: ISubmittedAnswer[];
        timeTaken?: number;
    }): Promise<IExamSubmission> {
        try {
            // Get current attempt count
            const attemptCount = await this._submissionRepository.getStudentAttemptCount(
                submissionData.scheduleId,
                submissionData.studentId
            );

            // Calculate max possible score
            const maxPossibleScore = submissionData.submittedAnswers.reduce(
                (total, answer) => total + answer.max_score,
                0
            );

            // Create submission object
            const submission: IExamSubmission = {
                schedule_id: submissionData.scheduleId,
                student_id: submissionData.studentId,
                course_id: submissionData.courseId,
                group_id: submissionData.groupId,
                submitted_answers: submissionData.submittedAnswers,
                submission_time: new Date(),
                time_taken: submissionData.timeTaken,
                max_possible_score: maxPossibleScore,
                is_graded: false,
                status: 'submitted',
                attempt_number: attemptCount + 1,
                created_at: new Date(),
                updated_at: new Date()
            };

            // Create the submission
            const createdSubmission = await this._submissionRepository.createSubmission(submission);

            // Update student's submission_ids
            await this._studentRepository.addSubmissionId(submissionData.studentId, createdSubmission._id!);

            // Auto-grade if possible (for MC, TF questions)
            const gradedSubmission = await this.gradeSubmission(createdSubmission._id!, 'system');

            return gradedSubmission || createdSubmission;
        } catch (error) {
            console.error('Error submitting exam:', error);
            throw new Error('Failed to submit exam');
        }
    }

    async getSubmissionById(id: string): Promise<IExamSubmission | null> {
        return await this._submissionRepository.getSubmissionById(id);
    }

    async getStudentSubmissions(studentId: string): Promise<IExamSubmission[]> {
        return await this._submissionRepository.getSubmissionsByStudentId(studentId);
    }

    async getScheduleSubmissions(scheduleId: string): Promise<any[]> {
        return await this._submissionRepository.getSubmissionsByScheduleId(scheduleId);
    }

    async getStudentSubmissionForSchedule(scheduleId: string, studentId: string): Promise<IExamSubmission | null> {
        return await this._submissionRepository.getSubmissionByScheduleAndStudent(scheduleId, studentId);
    }

    async gradeSubmission(submissionId: string, gradedBy: string): Promise<IExamSubmission | null> {
        try {
            const submission = await this._submissionRepository.getSubmissionById(submissionId);
            if (!submission) {
                throw new Error('Submission not found');
            }

            // Get the exam schedule to get correct answers
            const schedule = await this._scheduleRepository.getExaminationScheduleById(submission.schedule_id);
            if (!schedule) {
                throw new Error('Exam schedule not found');
            }

            let totalScore = 0;
            let correctAnswers = 0;

            // Grade each answer
            const gradedAnswers = submission.submitted_answers.map(submittedAnswer => {
                const question = schedule.questions.find((q: any) => q._id === submittedAnswer.question_id);
                if (!question) {
                    return { ...submittedAnswer, is_correct: false, score_obtained: 0 };
                }

                let isCorrect = false;
                let scoreObtained = 0;

                switch (submittedAnswer.question_type) {
                    case 'mc': // Multiple Choice
                        if (question.choices && submittedAnswer.submitted_choices) {
                            const correctChoices = question.choices
                                .filter((choice: any) => choice.isCorrect)
                                .map((choice: any) => choice.content);
                            
                            const submittedChoicesSet = new Set(submittedAnswer.submitted_choices);
                            const correctChoicesSet = new Set(correctChoices);
                            
                            isCorrect = submittedChoicesSet.size === correctChoicesSet.size &&
                                [...submittedChoicesSet].every(choice => correctChoicesSet.has(choice));
                            
                            if (isCorrect) {
                                scoreObtained = submittedAnswer.max_score;
                                correctAnswers++;
                            }
                        }
                        break;

                    case 'tf': // True/False
                        if (submittedAnswer.submitted_boolean !== undefined) {
                            isCorrect = submittedAnswer.submitted_boolean === question.isTrue;
                            if (isCorrect) {
                                scoreObtained = submittedAnswer.max_score;
                                correctAnswers++;
                            }
                        }
                        break;

                    case 'ses': // Short Essay - Manual grading required
                    case 'les': // Long Essay - Manual grading required
                        // For essay questions, we can't auto-grade
                        isCorrect = false; // Will be manually graded
                        scoreObtained = 0;
                        break;

                    case 'nested': // Nested questions - Handle recursively
                        // For now, mark as requiring manual grading
                        isCorrect = false;
                        scoreObtained = 0;
                        break;
                }

                totalScore += scoreObtained;

                return {
                    ...submittedAnswer,
                    is_correct: isCorrect,
                    score_obtained: scoreObtained
                };
            });

            // Calculate percentage
            const percentageScore = submission.max_possible_score > 0 
                ? (totalScore / submission.max_possible_score) * 100 
                : 0;

            // Update submission with grading results
            const updates: Partial<IExamSubmission> = {
                submitted_answers: gradedAnswers,
                total_score: totalScore,
                percentage_score: percentageScore,
                is_graded: true,
                graded_at: new Date(),
                graded_by: gradedBy,
                status: 'graded'
            };

            return await this._submissionRepository.updateSubmission(submissionId, updates);
        } catch (error) {
            console.error('Error grading submission:', error);
            throw new Error('Failed to grade submission');
        }
    }

    async updateSubmissionStatus(
        submissionId: string, 
        status: 'submitted' | 'graded' | 'reviewed'
    ): Promise<IExamSubmission | null> {
        return await this._submissionRepository.updateSubmission(submissionId, { status });
    }

    async getStudentAttemptCount(scheduleId: string, studentId: string): Promise<number> {
        return await this._submissionRepository.getStudentAttemptCount(scheduleId, studentId);
    }

    async canStudentAttemptExam(scheduleId: string, studentId: string, allowedAttempts: number): Promise<boolean> {
        const attemptCount = await this.getStudentAttemptCount(scheduleId, studentId);
        return attemptCount < allowedAttempts;
    }

    async deleteSubmission(id: string): Promise<boolean> {
        return await this._submissionRepository.deleteSubmission(id);
    }
}
