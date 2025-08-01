import { ExaminationScheduleDocument } from "../../../../types/exam";

export interface IExaminationScheduleService {
    getExaminationScheduleByExamId(exam_id: string): Promise<ExaminationScheduleDocument | null>;
    createExaminationSchedule(examIds: string[], instructorId: string, questionCount?: number, scheduleName?: string, examSettings?: any, selectedQuestions?: any[]): Promise<ExaminationScheduleDocument | null>;
    getExaminationScheduleById(id: string): Promise<ExaminationScheduleDocument | null>;
    updateExaminationSchedule(id: string, updateData: any): Promise<ExaminationScheduleDocument | null>;
    deleteExaminationSchedule(id: string): Promise<boolean>;
}
