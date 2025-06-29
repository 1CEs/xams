import { ExaminationScheduleDocument } from "../../../../types/exam";
import { IBaseRepository } from "../../../base/interface/ibase.repository";

export interface IExaminationScheduleRepository extends IBaseRepository<ExaminationScheduleDocument> {
    getExaminationScheduleByExamId(exam_id: string): Promise<ExaminationScheduleDocument | null>;
    createExaminationSchedule(examId: string, instructorId: string): Promise<ExaminationScheduleDocument | null>;
}
