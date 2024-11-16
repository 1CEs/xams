import { IExamination } from "../../../core/examination/model/interface/iexamination"
import { IQuestion } from "../../../core/examination/model/interface/iquestion"
import { IInstructor } from "../../../core/user/model/interface/iintructor"

export interface IExaminationController {
    // Examination-Only methods
    addExamination: (payload: Omit<IExamination, '_id' | 'questions'>, user: IInstructor) => Promise<ControllerResponse<IExamination | null>>
    getExaminations: () => Promise<ControllerResponse<IExamination[] | null>>
    getExaminationById: (id: string) => Promise<ControllerResponse<IExamination | null>>
    getExaminationByInstructorId: (instructor_id: string) => Promise<ControllerResponse<IExamination[] | null>>
    updateExamination: (id: string, payload: Partial<IExamination>) => Promise<ControllerResponse<IExamination | null>>
    deleteExamination: (id: string) => Promise<ControllerResponse<IExamination | null>>

    // Question-Only methods
    addExaminationQuestion: (id: string, payload: Omit<IQuestion, '_id'>) => Promise<ControllerResponse<IExamination | null>>
    updateQuestion: (id: string, question_id: string, payload: Partial<IQuestion>) => Promise<ControllerResponse<IExamination | null>>
}