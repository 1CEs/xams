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

    async getExaminationScheduleById(schedule_id: string): Promise<any | null> {
        const result = await this._model.findById(schedule_id).exec();
        return result;
    }

    async createExaminationSchedule(examIds: string[], instructorId: string, questionCount?: number, scheduleName?: string, examSettings?: any, selectedQuestions?: any[]): Promise<any | null> {
        // Get all original examinations
        const originalExams = await ExaminationModel.find({ _id: { $in: examIds } }).exec();
        
        if (!originalExams || originalExams.length === 0) {
            throw new Error(`No examinations found with provided IDs`);
        }

        if (originalExams.length !== examIds.length) {
            const foundIds = originalExams.map(exam => exam._id.toString());
            const missingIds = examIds.filter(id => !foundIds.includes(id));
            throw new Error(`Examinations not found with IDs: ${missingIds.join(', ')}`);
        }

        // Aggregate all questions from all exams
        const allQuestions: any[] = [];
        const examTitles: string[] = [];
        
        originalExams.forEach(exam => {
            if (exam.questions && exam.questions.length > 0) {
                allQuestions.push(...exam.questions);
            }
            examTitles.push(exam.title);
        });

        let questionsToUse = allQuestions;

        // DEBUG: Log what we receive from frontend
        console.log(selectedQuestions)
        console.log('=== EXAM SCHEDULE CREATION DEBUG ===');
        console.log('selectedQuestions received:', selectedQuestions ? selectedQuestions.length : 'null/undefined');
        console.log('selectedQuestions data:', JSON.stringify(selectedQuestions, null, 2));
        console.log('allQuestions count:', allQuestions.length);
        console.log('Sample allQuestion IDs:', allQuestions.slice(0, 3).map(q => ({ id: q._id.toString(), type: q.type })));

        // Use selectedQuestions from frontend if provided, otherwise fall back to original logic
        if (selectedQuestions && selectedQuestions.length > 0) {
            console.log('Using selectedQuestions from frontend');
            // Convert frontend selected questions to the format expected by the database
            questionsToUse = selectedQuestions.map((q, index) => {
                console.log(`Processing selected question ${index + 1}:`, {
                    question_id: q.question_id,
                    question_type: q.question_type,
                    score: q.score
                });
                
                // Find the original question from the exams to get the complete question data
                // Try multiple comparison methods to ensure we find the question
                let originalQuestion = allQuestions.find(oq => oq._id.toString() === q.question_id);
                
                if (!originalQuestion) {
                    // Try without toString() in case q.question_id is already a string
                    originalQuestion = allQuestions.find(oq => oq._id === q.question_id);
                }
                
                if (!originalQuestion) {
                    // Try converting q.question_id to ObjectId for comparison
                    originalQuestion = allQuestions.find(oq => oq._id.equals && oq._id.equals(q.question_id));
                }
                
                console.log('Question matching attempt:', {
                    target_id: q.question_id,
                    target_id_type: typeof q.question_id,
                    available_ids: allQuestions.slice(0, 3).map(oq => ({ 
                        id: oq._id.toString(), 
                        type: typeof oq._id, 
                        equals_target: oq._id.toString() === q.question_id 
                    }))
                });
                
                console.log('Found original question:', originalQuestion ? 'YES' : 'NO', 
                    originalQuestion ? { id: originalQuestion._id.toString(), type: originalQuestion.type } : 'null');
                    
                if (originalQuestion) {
                    const processedQuestion = {
                        ...originalQuestion,
                        // Preserve the question type from the frontend selection
                        type: q.question_type,
                        score: q.score
                    };
                    console.log('Processed question type:', processedQuestion.type);
                    return processedQuestion;
                }
                return originalQuestion;
            }).filter(Boolean); // Remove any null/undefined questions
            
            console.log('Final questionsToUse:', questionsToUse.map(q => ({ id: q._id?.toString(), type: q.type, score: q.score })));
        } else {
            console.log('No selectedQuestions provided, using fallback logic');
            if (questionCount && questionCount > 0) {
                // Fallback to original logic if no selectedQuestions provided
                questionsToUse = this.selectQuestionsWithCount(allQuestions, questionCount);
            }
        }
        console.log('=== END DEBUG ===');

        // Create a new examination schedule with the selected questions and exam settings
        const examinationSchedule = new ExaminationScheduleModel({
            exam_ids: examIds,
            instructor_id: instructorId,
            title: scheduleName || examTitles.join(' + '), // Use custom name or combine exam titles
            description: `Combined examination from: ${examTitles.join(', ')}`,
            questions: JSON.parse(JSON.stringify(questionsToUse)), // Deep copy of selected questions
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
