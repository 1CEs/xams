import { ExaminationScheduleDocument } from "../../../types/exam";
import { BaseRepository } from "../../base/base.repository";
import { ExaminationModel } from "../model/examination.model";
import { ExaminationScheduleModel } from "../model/examination-schedule.model";
import { IExaminationScheduleRepository } from "./interface/iexam-schedule.repository";

export class ExaminationScheduleRepository
    extends BaseRepository<ExaminationScheduleDocument>
    implements IExaminationScheduleRepository {

    constructor() {
        super(ExaminationScheduleModel)
    }

    async getExaminationScheduleByExamId(exam_id: string): Promise<ExaminationScheduleDocument | null> {
        const result = await this._model.findOne({ original_exam_id: exam_id }).exec();
        return result;
    }

    async createExaminationSchedule(examId: string, instructorId: string, questionCount?: number, scheduleName?: string, examSettings?: any): Promise<ExaminationScheduleDocument | null> {
        // First, get the original examination
        const originalExam = await ExaminationModel.findById(examId).exec();
        
        if (!originalExam) {
            throw new Error(`Examination with ID ${examId} not found`);
        }

        // Get all questions from the original exam
        const allQuestions = originalExam.questions || [];
        let selectedQuestions = allQuestions;

        // If questionCount is specified and valid, randomly select that many questions
        if (questionCount && questionCount > 0 && questionCount < allQuestions.length) {
            // Shuffle the questions array using Fisher-Yates algorithm
            const shuffledQuestions = [...allQuestions];
            for (let i = shuffledQuestions.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffledQuestions[i], shuffledQuestions[j]] = [shuffledQuestions[j], shuffledQuestions[i]];
            }
            
            // Take the first 'questionCount' questions
            selectedQuestions = shuffledQuestions.slice(0, questionCount);
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
}
