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

    async createExaminationSchedule(examId: string, instructorId: string): Promise<ExaminationScheduleDocument | null> {
        // First, get the original examination
        const originalExam = await ExaminationModel.findById(examId).exec();
        
        if (!originalExam) {
            throw new Error(`Examination with ID ${examId} not found`);
        }

        // Create a new examination schedule with the original exam's data
        const examinationSchedule = new ExaminationScheduleModel({
            original_exam_id: examId,
            instructor_id: instructorId,
            title: originalExam.title,
            description: originalExam.description,
            category: originalExam.category,
            questions: JSON.parse(JSON.stringify(originalExam.questions)), // Deep copy of questions
            created_at: new Date()
        });

        // Save the examination schedule
        const result = await examinationSchedule.save();
        return result;
    }
}
