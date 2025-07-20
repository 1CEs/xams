import { ExaminationScheduleDocument } from "../../../types/exam";
import { ExaminationScheduleRepository } from "../repository/exam-schedule.repository";
import { IExaminationScheduleRepository } from "../repository/interface/iexam-schedule.repository";
import { IExaminationScheduleService } from "./interface/iexam-schedule.service";

export class ExaminationScheduleService implements IExaminationScheduleService {
    private _repository: IExaminationScheduleRepository;

    constructor() {
        this._repository = new ExaminationScheduleRepository();
    }

    async getExaminationScheduleByExamId(exam_id: string): Promise<ExaminationScheduleDocument | null> {
        return await this._repository.getExaminationScheduleByExamId(exam_id);
    }

    async createExaminationSchedule(examIds: string[], instructorId: string, questionCount?: number, scheduleName?: string, examSettings?: any): Promise<ExaminationScheduleDocument | null> {
        return await this._repository.createExaminationSchedule(examIds, instructorId, questionCount, scheduleName, examSettings);
    }

    async getExaminationScheduleById(id: string): Promise<ExaminationScheduleDocument | null> {
        return await this._repository.findById(id);
    }

    async deleteExaminationSchedule(id: string): Promise<boolean> {
        const result = await this._repository.delete(id);
        
        return result !== null;
    }
}
