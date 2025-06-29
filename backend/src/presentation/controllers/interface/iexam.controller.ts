import { IExamination } from "../../../core/examination/model/interface/iexamination"
import { IExaminationSchedule } from "../../../core/examination/model/interface/iexamination-schedule"
import { IQuestion } from "../../../core/examination/model/interface/iquestion"
import { IInstructor } from "../../../core/user/model/interface/iintructor"
import { Answer, ExamResult } from "../../../types/exam"

export interface IExaminationController {
    // Examination-Only methods
    addExamination: (payload: Omit<IExamination, '_id' | 'questions'>, user: IInstructor) => Promise<ControllerResponse<IExamination | null>>
    getExaminations: (user?: IInstructor) => Promise<ControllerResponse<IExamination[] | null>>
    getExaminationById: (id: string, user?: IInstructor, scheduleId?: string) => Promise<ControllerResponse<IExamination | IExaminationSchedule | null>>
    getExaminationByInstructorId: (instructor_id: string, user?: IInstructor) => Promise<ControllerResponse<IExamination[] | null>>
    updateExamination: (id: string, payload: Partial<IExamination>, user?: IInstructor) => Promise<ControllerResponse<IExamination | null>>
    deleteExamination: (id: string, user?: IInstructor) => Promise<ControllerResponse<IExamination | null>>
        
    // Question-Only methods
    addExaminationQuestion: (id: string, payload: Omit<IQuestion, '_id'>, user?: IInstructor) => Promise<ControllerResponse<IExamination | null>>
    updateQuestion: (id: string, question_id: string, payload: Partial<IQuestion>, user?: IInstructor) => Promise<ControllerResponse<IExamination | null>>
    deleteQuestion: (id: string, question_id: string, user?: IInstructor) => Promise<ControllerResponse<IExamination | null>>

    // Nested Question methods
    addNestedQuestion: (id: string, payload: { question: string; type: string; score: number; questions: IQuestion[] }, user?: IInstructor) => Promise<ControllerResponse<IExamination | null>>
    addNestedQuestionFromExisting: (examId: string, nestedQuestionData: { question: string; score: number }, questionIds: string[], user?: IInstructor) => Promise<ControllerResponse<IExamination | null>>

    // Result-Only methods
    resultSubmit: (examId: string, answers: Answer[], scheduleId?: string) => Promise<ControllerResponse<ExamResult | null>>
}

type ControllerResponse<T> = {
    message: string;
    code: number;
    data: T;
}
