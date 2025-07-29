import { IExamSubmissionService } from "./interface/iexam-submission.service";
import { IExamSubmission, ISubmittedAnswer } from "../model/interface/iexam-submission";
import { ExamSubmissionRepository } from "../repository/exam-submission.repository";
import { StudentRepository } from "../../user/repository/student.repository";
import { ExaminationScheduleRepository } from "../repository/exam-schedule.repository";
import { AIAssistantService } from "../../ai/service/ai-assistant.service";

export class ExamSubmissionService implements IExamSubmissionService {
    private _submissionRepository: ExamSubmissionRepository;
    private _studentRepository: StudentRepository;
    private _scheduleRepository: ExaminationScheduleRepository;
    private _aiAssistantService: AIAssistantService;

    constructor() {
        this._submissionRepository = new ExamSubmissionRepository();
        this._studentRepository = new StudentRepository();
        this._scheduleRepository = new ExaminationScheduleRepository();
        this._aiAssistantService = new AIAssistantService();
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
        try {
            const submissions = await this._submissionRepository.getSubmissionsByScheduleId(scheduleId);
            
            // Get the exam schedule to access original questions
            const schedule = await this._scheduleRepository.getExaminationScheduleById(scheduleId);
            if (!schedule) {
                return submissions;
            }

            // Enhance submissions with original question choices
            const enhancedSubmissions = submissions.map(submission => {
                const enhancedAnswers = submission.submitted_answers.map((answer: any) => {
                    const question = schedule.questions.find((q: any) => q._id === answer.question_id);
                    
                    return {
                        ...answer,
                        // Include original choices for multiple choice questions
                        original_choices: question?.choices ? question.choices.map((choice: any) => ({
                            content: choice.content,
                            isCorrect: choice.isCorrect
                        })) : undefined
                    };
                });

                return {
                    ...submission,
                    submitted_answers: enhancedAnswers
                };
            });

            return enhancedSubmissions;
        } catch (error) {
            console.error('Error getting schedule submissions:', error);
            throw new Error('Failed to get schedule submissions');
        }
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
            const gradedAnswers = [];
            
            for (const submittedAnswer of submission.submitted_answers) {
                const question = schedule.questions.find((q: any) => q._id === submittedAnswer.question_id);
                if (!question) {
                    gradedAnswers.push({ ...submittedAnswer, is_correct: false, score_obtained: 0 });
                    continue;
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

                    case 'ses': // Short Essay - Can auto-grade with multiple expected answers
                    case 'les': // Long Essay - Can auto-grade with multiple expected answers
                        // Check if AI assistant grading is enabled
                        if (schedule.assistant_grading && submittedAnswer.submitted_answer) {
                            // Use AI assistant for grading
                            try {
                                const aiResult = await this._aiAssistantService.gradeEssayQuestion(
                                    question.question || '',
                                    submittedAnswer.submitted_answer,
                                    question.expectedAnswers || [],
                                    submittedAnswer.max_score,
                                    submittedAnswer.question_type as 'ses' | 'les'
                                );
                                
                                isCorrect = aiResult.isCorrect;
                                scoreObtained = aiResult.scoreObtained;
                                
                                // Store AI grading information for reference
                                (submittedAnswer as any).ai_grading = {
                                    suggestion: aiResult.suggestion,
                                    confidence: aiResult.confidence,
                                    graded_by: 'ai_assistant',
                                    graded_at: new Date()
                                };
                                
                                if (isCorrect) {
                                    correctAnswers++;
                                }
                                
                                console.log(`AI graded ${submittedAnswer.question_type} question:`, {
                                    questionId: submittedAnswer.question_id,
                                    isCorrect,
                                    scoreObtained,
                                    confidence: aiResult.confidence
                                });
                            } catch (error) {
                                console.error('AI grading failed, falling back to traditional method:', error);
                                // Fallback to traditional grading
                                if (question.expectedAnswers && question.expectedAnswers.length > 0) {
                                    const submittedText = submittedAnswer.submitted_answer.toLowerCase().trim();
                                    const expectedAnswers = question.expectedAnswers.map((answer: string) => answer.toLowerCase().trim());
                                    
                                    isCorrect = expectedAnswers.some((expectedAnswer: string) => {
                                        return submittedText === expectedAnswer || 
                                               (expectedAnswer.length > 10 && submittedText.includes(expectedAnswer)) ||
                                               (submittedText.length > 10 && expectedAnswer.includes(submittedText));
                                    });
                                    
                                    if (isCorrect) {
                                        scoreObtained = submittedAnswer.max_score;
                                        correctAnswers++;
                                    }
                                }
                            }
                        } else if (question.expectedAnswers && question.expectedAnswers.length > 0 && submittedAnswer.submitted_answer) {
                            // Traditional auto-grading by checking if submitted answer matches any expected answer
                            const submittedText = submittedAnswer.submitted_answer.toLowerCase().trim();
                            const expectedAnswers = question.expectedAnswers.map((answer: string) => answer.toLowerCase().trim());
                            
                            // Check for exact match or partial match (contains logic)
                            isCorrect = expectedAnswers.some((expectedAnswer: string) => {
                                return submittedText === expectedAnswer || 
                                       (expectedAnswer.length > 10 && submittedText.includes(expectedAnswer)) ||
                                       (submittedText.length > 10 && expectedAnswer.includes(submittedText));
                            });
                            
                            if (isCorrect) {
                                scoreObtained = submittedAnswer.max_score;
                                correctAnswers++;
                            }
                        } else {
                            // No expected answers provided and no AI grading, requires manual grading
                            isCorrect = false;
                            scoreObtained = 0;
                        }
                        break;

                    case 'nested': // Nested questions - Handle recursively
                        // For now, mark as requiring manual grading
                        isCorrect = false;
                        scoreObtained = 0;
                        break;
                }

                totalScore += scoreObtained;

                gradedAnswers.push({
                    ...submittedAnswer,
                    is_correct: isCorrect,
                    score_obtained: scoreObtained,
                    // Include original choices for multiple choice questions
                    original_choices: question.choices ? question.choices.map((choice: any) => ({
                        content: choice.content,
                        isCorrect: choice.isCorrect
                    })) : undefined
                });
            }

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

    async manualGradeQuestion(
        submissionId: string, 
        questionId: string, 
        scoreObtained: number, 
        isCorrect: boolean, 
        gradedBy: string
    ): Promise<IExamSubmission | null> {
        try {
            const submission = await this._submissionRepository.getSubmissionById(submissionId);
            if (!submission) {
                throw new Error('Submission not found');
            }

            // Find and update the specific question
            const updatedAnswers = submission.submitted_answers.map(answer => {
                if (answer.question_id === questionId) {
                    return {
                        ...answer,
                        is_correct: isCorrect,
                        score_obtained: scoreObtained
                    };
                }
                return answer;
            });

            // Recalculate total score
            const totalScore = updatedAnswers.reduce((sum, answer) => {
                return sum + (answer.score_obtained || 0);
            }, 0);

            // Calculate percentage
            const percentageScore = submission.max_possible_score > 0 
                ? (totalScore / submission.max_possible_score) * 100 
                : 0;

            // Check if all essay questions are graded
            const allEssayQuestionsGraded = updatedAnswers.every(answer => {
                if (answer.question_type === 'ses' || answer.question_type === 'les') {
                    return answer.score_obtained !== undefined && answer.is_correct !== undefined;
                }
                return true; // Non-essay questions are auto-graded
            });

            const updates: Partial<IExamSubmission> = {
                submitted_answers: updatedAnswers,
                total_score: totalScore,
                percentage_score: percentageScore,
                graded_by: gradedBy,
                graded_at: new Date(),
                is_graded: allEssayQuestionsGraded,
                status: allEssayQuestionsGraded ? 'graded' : 'submitted'
            };

            return await this._submissionRepository.updateSubmission(submissionId, updates);
        } catch (error) {
            console.error('Error manually grading question:', error);
            throw new Error('Failed to manually grade question');
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
