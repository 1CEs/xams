import { BaseRepository } from "../../base/base.repository";
import { ExaminationModel } from "../model/examination.model";
import { ExaminationScheduleModel } from "../model/examination-schedule.model";
import { IExaminationScheduleRepository } from "./interface/iexam-schedule.repository";

export class ExaminationScheduleRepository
    extends BaseRepository<any>
    implements IExaminationScheduleRepository {

    constructor() {
        super(ExaminationScheduleModel)
    }

    async getExaminationScheduleByExamId(exam_id: string): Promise<any | null> {
        const result = await this._model.findOne({ original_exam_id: exam_id }).exec();
        return result;
    }

    async createExaminationSchedule(examId: string, instructorId: string, questionCount?: number, scheduleName?: string, examSettings?: any): Promise<any | null> {
        // First, get the original examination
        const originalExam = await ExaminationModel.findById(examId).exec();
        
        if (!originalExam) {
            throw new Error(`Examination with ID ${examId} not found`);
        }

        // Get all questions from the original exam
        const allQuestions = originalExam.questions || [];
        let selectedQuestions = allQuestions;

        // If questionCount is specified and valid, intelligently select questions
        if (questionCount && questionCount > 0) {
            selectedQuestions = this.selectQuestionsWithCount(allQuestions, questionCount);
        }

        // Create a new examination schedule with the selected questions and exam settings
        const examinationSchedule = new ExaminationScheduleModel({
            original_exam_id: examId,
            instructor_id: instructorId,
            title: scheduleName || originalExam.title, // Use custom name if provided
            description: originalExam.description,
            category: originalExam.category,
            questions: JSON.parse(JSON.stringify(selectedQuestions)), // Deep copy of selected questions
            created_at: new Date(),
            
            // Include exam settings if provided
            ...(examSettings && {
                open_time: examSettings.open_time,
                close_time: examSettings.close_time,
                ip_range: examSettings.ip_range,
                exam_code: examSettings.exam_code,
                allowed_attempts: examSettings.allowed_attempts,
                allowed_review: examSettings.allowed_review,
                show_answer: examSettings.show_answer,
                randomize_question: examSettings.randomize_question,
                randomize_choice: examSettings.randomize_choice,
                question_count: questionCount
            })
        });

        // Save the examination schedule
        const result = await examinationSchedule.save();
        return result;
    }

    /**
     * Counts the total number of individual questions (including nested sub-questions)
     */
    private countTotalQuestions(questions: any[]): number {
        let total = 0;
        for (const question of questions) {
            if (question.type === 'nested' && question.questions && Array.isArray(question.questions)) {
                // For nested questions, count all sub-questions
                total += question.questions.length;
            } else {
                // For regular questions, count as 1
                total += 1;
            }
        }
        return total;
    }

    /**
     * Intelligently selects questions to match the desired question count
     * Accounts for nested questions and their sub-questions
     */
    private selectQuestionsWithCount(allQuestions: any[], targetCount: number): any[] {
        if (targetCount <= 0) return [];
        
        // Calculate total available questions
        const totalAvailable = this.countTotalQuestions(allQuestions);
        
        if (targetCount >= totalAvailable) {
            console.log(`Using all ${allQuestions.length} questions (${totalAvailable} total individual questions)`);
            return allQuestions;
        }

        console.log(`Selecting questions to get exactly ${targetCount} individual questions from ${totalAvailable} available`);

        // Shuffle questions for random selection
        const shuffledQuestions = [...allQuestions];
        for (let i = shuffledQuestions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffledQuestions[i], shuffledQuestions[j]] = [shuffledQuestions[j], shuffledQuestions[i]];
        }

        const selectedQuestions: any[] = [];
        let currentCount = 0;

        for (const question of shuffledQuestions) {
            const questionValue = question.type === 'nested' && question.questions 
                ? question.questions.length 
                : 1;

            // If adding this question would exceed the target, try to handle it
            if (currentCount + questionValue > targetCount) {
                const remaining = targetCount - currentCount;
                
                if (question.type === 'nested' && question.questions && remaining > 0) {
                    // For nested questions, we can select a subset of sub-questions
                    const modifiedNestedQuestion = {
                        ...question,
                        questions: question.questions.slice(0, remaining)
                    };
                    selectedQuestions.push(modifiedNestedQuestion);
                    currentCount += remaining;
                    console.log(`Added nested question with ${remaining} sub-questions`);
                }
                // If it's a regular question and would exceed, skip it
                break;
            } else {
                // Add the question as it fits within the target
                selectedQuestions.push(question);
                currentCount += questionValue;
                
                if (question.type === 'nested') {
                    console.log(`Added nested question with ${questionValue} sub-questions`);
                } else {
                    console.log(`Added regular question`);
                }
            }

            // Stop if we've reached the exact target
            if (currentCount >= targetCount) {
                break;
            }
        }

        const finalCount = this.countTotalQuestions(selectedQuestions);
        console.log(`Successfully selected ${selectedQuestions.length} questions with ${finalCount} total individual questions`);
        
        return selectedQuestions;
    }
}
