import { IExamination } from "../../../core/examination/model/interface/iexamination"

export interface IExaminationController {
    addExamination: (payload: Omit<IExamination, '_id'>) => Promise<ControllerResponse<IExamination | null>>
    getExaminations: () => Promise<ControllerResponse<IExamination[] | null>>
    getExaminationById: (id: string) => Promise<ControllerResponse<IExamination | null>>
    updateExamination: (id: string, payload: Partial<IExamination>) => Promise<ControllerResponse<IExamination | null>>
    deleteExamination: (id: string) => Promise<ControllerResponse<IExamination | null>>
}