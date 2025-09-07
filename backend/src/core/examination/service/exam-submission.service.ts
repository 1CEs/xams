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

    /**
     * Strips HTML tags from a string to get plain text
     * @param htmlString - String that may contain HTML tags
     * @returns Plain text without HTML tags
     */
    private stripHtmlTags(htmlString: string): string {
        return htmlString.replace(/<[^>]*>/g, '').trim();
    }

    async submitExam(submissionData: {
        scheduleId: string;
        studentId: string;
        courseId?: string;
        groupId?: string;
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

            console.log('📝 Submission data:', submission);

            const createdSubmission = await this._submissionRepository.createSubmission(submission);
            await this._studentRepository.addSubmissionId(submission.student_id, createdSubmission._id!);

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
                    
                    let enhancedAnswer = {
                        ...answer,
                        // Include original choices for multiple choice questions
                        original_choices: question?.choices ? question.choices.map((choice: any) => ({
                            content: choice.content,
                            isCorrect: choice.isCorrect
                        })) : undefined
                    };

                    // Handle nested questions - populate original_choices for nested MC questions
                    if (answer.question_type === 'nested' && answer.graded_nested_answers && question?.questions) {
                        const enhancedNestedAnswers = answer.graded_nested_answers.map((nestedAnswer: any) => {
                            const nestedQuestion = question.questions.find((nq: any) => nq._id === nestedAnswer.question_id);
                            
                            return {
                                ...nestedAnswer,
                                // Include original choices for nested multiple choice questions
                                original_choices: nestedQuestion?.choices ? nestedQuestion.choices.map((choice: any) => ({
                                    content: choice.content,
                                    isCorrect: choice.isCorrect
                                })) : undefined
                            };
                        });
                        
                        enhancedAnswer = {
                            ...enhancedAnswer,
                            graded_nested_answers: enhancedNestedAnswers
                        };
                    }

                    return enhancedAnswer;
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
        try {
            const submission = await this._submissionRepository.getSubmissionByScheduleAndStudent(scheduleId, studentId);
            if (!submission) {
                return null;
            }

            // Get the exam schedule to access original questions
            const schedule = await this._scheduleRepository.getExaminationScheduleById(scheduleId);
            if (!schedule) {
                return submission;
            }

            // Enhance submission with original question choices
            const enhancedAnswers = submission.submitted_answers.map((answer: any) => {
                const question = schedule.questions.find((q: any) => q._id === answer.question_id);
                
                let enhancedAnswer = {
                    ...answer,
                    // Include original choices for multiple choice questions
                    original_choices: question?.choices ? question.choices.map((choice: any) => ({
                        content: choice.content,
                        isCorrect: choice.isCorrect
                    })) : undefined
                };

                // Handle nested questions - populate original_choices for nested MC questions
                if (answer.question_type === 'nested' && answer.graded_nested_answers && question?.questions) {
                    const enhancedNestedAnswers = answer.graded_nested_answers.map((nestedAnswer: any) => {
                        const nestedQuestion = question.questions.find((nq: any) => nq._id === nestedAnswer.question_id);
                        
                        return {
                            ...nestedAnswer,
                            // Include original choices for nested multiple choice questions
                            original_choices: nestedQuestion?.choices ? nestedQuestion.choices.map((choice: any) => ({
                                content: choice.content,
                                isCorrect: choice.isCorrect
                            })) : undefined
                        };
                    });
                    
                    enhancedAnswer = {
                        ...enhancedAnswer,
                        graded_nested_answers: enhancedNestedAnswers
                    };
                }

                return enhancedAnswer;
            });

            return {
                ...submission,
                submitted_answers: enhancedAnswers
            };
        } catch (error) {
            console.error('Error getting student submission for schedule:', error);
            throw new Error('Failed to get student submission for schedule');
        }
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
                        if (submittedAnswer.submitted_answer && question.expectedAnswers && question.expectedAnswers.length > 0) {
                            // First, check for exact match with expected answers
                            console.log('Submitted answer:', submittedAnswer.submitted_answer);
                            console.log('Expected answers:', question.expectedAnswers);
                            
                            const submittedText = submittedAnswer.submitted_answer.toLowerCase().trim();
                            // Strip HTML tags from expected answers and normalize
                            const expectedAnswers = question.expectedAnswers.map((answer: string) => 
                                this.stripHtmlTags(answer).toLowerCase().trim()
                            );
                            
                            console.log('Cleaned expected answers:', expectedAnswers);
                            
                            // Check for exact match first
                            const exactMatch = expectedAnswers.some((expectedAnswer: string) => submittedText === expectedAnswer);
                            
                            if (exactMatch) {
                                // Exact match found - give full score without AI grading
                                isCorrect = true;
                                scoreObtained = submittedAnswer.max_score;
                                correctAnswers++;
                                
                                console.log(`Exact match found for ${submittedAnswer.question_type} question - full score awarded:`, {
                                    questionId: submittedAnswer.question_id,
                                    submittedAnswer: submittedText,
                                    scoreObtained: submittedAnswer.max_score
                                });
                            } else if (schedule.assistant_grading) {
                                // No exact match - use AI assistant for grading
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
                                    // Fallback to traditional grading with partial matching
                                    isCorrect = expectedAnswers.some((expectedAnswer: string) => {
                                        return (expectedAnswer.length > 10 && submittedText.includes(expectedAnswer)) ||
                                               (submittedText.length > 10 && expectedAnswer.includes(submittedText));
                                    });
                                    
                                    if (isCorrect) {
                                        scoreObtained = submittedAnswer.max_score;
                                        correctAnswers++;
                                    }
                                }
                            } else {
                                // No AI grading - use traditional partial matching
                                isCorrect = expectedAnswers.some((expectedAnswer: string) => {
                                    return (expectedAnswer.length > 10 && submittedText.includes(expectedAnswer)) ||
                                           (submittedText.length > 10 && expectedAnswer.includes(submittedText));
                                });
                                
                                if (isCorrect) {
                                    scoreObtained = submittedAnswer.max_score;
                                    correctAnswers++;
                                }
                            }
                        } else {
                            // No expected answers provided and no AI grading, requires manual grading
                            isCorrect = false;
                            scoreObtained = 0;
                        }
                        break;

                    case 'nested': // Nested questions - Handle recursively
                        if ((submittedAnswer as any).nested_answers && Array.isArray((submittedAnswer as any).nested_answers)) {
                            let nestedCorrectCount = 0;
                            let nestedTotalScore = 0;
                            const gradedNestedAnswers = [];
                            
                            for (const nestedAnswer of (submittedAnswer as any).nested_answers) {
                                const nestedQuestion = question.questions?.find((q: any) => q._id === nestedAnswer.question_id);
                                if (!nestedQuestion) continue;
                                
                                let nestedIsCorrect = false;
                                let nestedScoreObtained = 0;
                                
                                switch (nestedAnswer.question_type) {
                                    case 'mc': // Multiple Choice
                                        if (nestedQuestion.choices && nestedAnswer.submitted_choices) {
                                            const correctChoices = nestedQuestion.choices
                                                .filter((choice: any) => choice.isCorrect)
                                                .map((choice: any) => choice.content);
                                            
                                            const submittedChoicesSet = new Set(nestedAnswer.submitted_choices);
                                            const correctChoicesSet = new Set(correctChoices);
                                            
                                            nestedIsCorrect = submittedChoicesSet.size === correctChoicesSet.size &&
                                                [...submittedChoicesSet].every(choice => correctChoicesSet.has(choice));
                                            
                                            if (nestedIsCorrect) {
                                                nestedScoreObtained = nestedAnswer.max_score;
                                                nestedCorrectCount++;
                                            }
                                        }
                                        break;
                                        
                                    case 'tf': // True/False
                                        if (nestedAnswer.submitted_boolean !== undefined) {
                                            nestedIsCorrect = nestedAnswer.submitted_boolean === nestedQuestion.isTrue;
                                            if (nestedIsCorrect) {
                                                nestedScoreObtained = nestedAnswer.max_score;
                                                nestedCorrectCount++;
                                            }
                                        }
                                        break;
                                        
                                    case 'ses': // Short Essay
                                    case 'les': // Long Essay
                                        if (nestedAnswer.submitted_answer && nestedQuestion.expectedAnswers && nestedQuestion.expectedAnswers.length > 0) {
                                            const submittedText = nestedAnswer.submitted_answer.toLowerCase().trim();
                                            const expectedAnswers = nestedQuestion.expectedAnswers.map((answer: string) => 
                                                this.stripHtmlTags(answer).toLowerCase().trim()
                                            );
                                            
                                            // Check for exact match first
                                            const exactMatch = expectedAnswers.some((expectedAnswer: string) => submittedText === expectedAnswer);
                                            
                                            if (exactMatch) {
                                                nestedIsCorrect = true;
                                                nestedScoreObtained = nestedAnswer.max_score;
                                                nestedCorrectCount++;
                                            } else if (schedule.assistant_grading) {
                                                // Use AI grading for nested essay questions
                                                try {
                                                    const aiResult = await this._aiAssistantService.gradeEssayQuestion(
                                                        nestedQuestion.question || '',
                                                        nestedAnswer.submitted_answer,
                                                        nestedQuestion.expectedAnswers || [],
                                                        nestedAnswer.max_score,
                                                        nestedAnswer.question_type as 'ses' | 'les'
                                                    );
                                                    
                                                    nestedIsCorrect = aiResult.isCorrect;
                                                    nestedScoreObtained = aiResult.scoreObtained;
                                                    
                                                    if (nestedIsCorrect) {
                                                        nestedCorrectCount++;
                                                    }
                                                } catch (error) {
                                                    console.error('AI grading failed for nested question:', error);
                                                    // Fallback to partial matching
                                                    nestedIsCorrect = expectedAnswers.some((expectedAnswer: string) => {
                                                        return (expectedAnswer.length > 10 && submittedText.includes(expectedAnswer)) ||
                                                               (submittedText.length > 10 && expectedAnswer.includes(submittedText));
                                                    });
                                                    
                                                    if (nestedIsCorrect) {
                                                        nestedScoreObtained = nestedAnswer.max_score;
                                                        nestedCorrectCount++;
                                                    }
                                                }
                                            } else {
                                                // Traditional partial matching
                                                nestedIsCorrect = expectedAnswers.some((expectedAnswer: string) => {
                                                    return (expectedAnswer.length > 10 && submittedText.includes(expectedAnswer)) ||
                                                           (submittedText.length > 10 && expectedAnswer.includes(submittedText));
                                                });
                                                
                                                if (nestedIsCorrect) {
                                                    nestedScoreObtained = nestedAnswer.max_score;
                                                    nestedCorrectCount++;
                                                }
                                            }
                                        }
                                        break;
                                }
                                
                                nestedTotalScore += nestedScoreObtained;
                                gradedNestedAnswers.push({
                                    ...nestedAnswer,
                                    is_correct: nestedIsCorrect,
                                    score_obtained: nestedScoreObtained,
                                    // Include original choices for nested multiple choice questions
                                    original_choices: nestedQuestion.choices ? nestedQuestion.choices.map((choice: any) => ({
                                        content: choice.content,
                                        isCorrect: choice.isCorrect
                                    })) : undefined
                                });
                            }
                            
                            // Calculate overall nested question correctness and score
                            const allNestedCorrect = gradedNestedAnswers.length > 0 && gradedNestedAnswers.every(na => na.is_correct);
                            isCorrect = allNestedCorrect;
                            scoreObtained = nestedTotalScore;
                            
                            if (allNestedCorrect) {
                                correctAnswers++; // Count the nested question as correct if all sub-questions are correct
                            }
                            
                            // Store graded nested answers
                            (submittedAnswer as any).graded_nested_answers = gradedNestedAnswers;
                            
                            console.log(`Graded nested question:`, {
                                questionId: submittedAnswer.question_id,
                                totalSubQuestions: gradedNestedAnswers.length,
                                correctSubQuestions: nestedCorrectCount,
                                allCorrect: allNestedCorrect,
                                totalScore: nestedTotalScore
                            });
                        } else {
                            // No nested answers provided, requires manual grading
                            isCorrect = false;
                            scoreObtained = 0;
                        }
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
                status: 'graded',
                updated_at: new Date() // Ensure updated_at is set
            };

            console.log('💾 Updating submission with grading results:', {
                submissionId,
                totalScore,
                percentageScore,
                isGraded: true,
                status: 'graded',
                answersCount: gradedAnswers.length
            });

            const updatedSubmission = await this._submissionRepository.updateSubmission(submissionId, updates);
            
            if (updatedSubmission) {
                console.log('✅ Submission successfully updated in database:', {
                    id: updatedSubmission._id,
                    isGraded: updatedSubmission.is_graded,
                    status: updatedSubmission.status,
                    totalScore: updatedSubmission.total_score
                });
            } else {
                console.error('❌ Failed to update submission - updateSubmission returned null');
            }

            return updatedSubmission;
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

    async deleteSubmissionsByScheduleId(scheduleId: string): Promise<boolean> {
        return await this._submissionRepository.deleteSubmissionsByScheduleId(scheduleId);
    }
}
