import { ExaminationScheduleDocument } from "../../../../types/exam";
import { IBaseRepository } from "../../../base/interface/ibase.repository";

export interface IExaminationScheduleRepository extends IBaseRepository<ExaminationScheduleDocument> {
    getExaminationScheduleByExamId(exam_id: string): Promise<ExaminationScheduleDocument | null>;
    getExaminationScheduleById(schedule_id: string): Promise<ExaminationScheduleDocument | null>;
    createExaminationSchedule(examIds: string[], instructorId: string, questionCount?: number, scheduleName?: string, examSettings?: any, selectedQuestions?: any[]): Promise<ExaminationScheduleDocument | null>;
}
