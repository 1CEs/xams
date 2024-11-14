import { UpdateWriteOpResult } from "mongoose";
import { IExamination } from "../../model/interface/iexamination";

export interface IExaminationService {
    addExamination: (payload: Omit<IExamination, '_id'>) => Promise<Omit<IExamination, '_id'> | null>
    getExaminations: () => Promise<IExamination[] | null>
    getExaminationById: (id: string) => Promise<IExamination | null>
    updateExamination: (id: string, payload: Partial<IExamination>) => Promise<IExamination | null>
    deleteExamination: (id: string) => Promise<IExamination | null>
}