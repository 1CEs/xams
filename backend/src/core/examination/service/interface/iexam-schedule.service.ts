import { ExaminationScheduleDocument } from "../../../../types/exam";

export interface IExaminationScheduleService {
    getExaminationScheduleByExamId(exam_id: string): Promise<ExaminationScheduleDocument | null>;
    createExaminationSchedule(examId: string, instructorId: string): Promise<ExaminationScheduleDocument | null>;
    getExaminationScheduleById(id: string): Promise<ExaminationScheduleDocument | null>;
}
