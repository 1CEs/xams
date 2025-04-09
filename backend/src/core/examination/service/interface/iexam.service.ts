import { IExamination } from "../../model/interface/iexamination";
import { IQuestion } from "../../model/interface/iquestion";

export interface IExaminationService {
    // Examination-Only methods
    addExamination: (payload: Omit<IExamination, '_id' | 'questions'>) => Promise<IExamination | null>
    getExaminations: () => Promise<IExamination[] | null>
    getExaminationById: (id: string) => Promise<IExamination | null>
    getExaminationByInstructorId: (instructor_id: string) => Promise<IExamination[] | null>
    updateExamination: (id: string, payload: Partial<IExamination>) => Promise<IExamination | null>
    deleteExamination: (id: string) => Promise<IExamination | null>
    verifyPassword: (examination_id: string, group_id: string, password: string) => Promise<IExamination | null>

    // Question-Only methods
    addExaminationQuestion: (id: string, payload: Omit<IQuestion, '_id'>) => Promise<IExamination | null>
    updateQuestion: (id: string, question_id: string, payload: Partial<IQuestion>) => Promise<IExamination | null>
    deleteQuestion: (id: string, question_id: string) => Promise<IExamination | null>
    addNestedQuestion: (id: string, payload: { question: string; type: string; score: number; questions: IQuestion[] }) => Promise<IExamination | null>
}