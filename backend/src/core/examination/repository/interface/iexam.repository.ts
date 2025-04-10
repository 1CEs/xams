import { Answer, ExamResult } from "../../../../types/exam";
import { IBaseRepository } from "../../../base/interface/ibase.repository";
import { IExamination } from "../../model/interface/iexamination";
import { IQuestion } from "../../model/interface/iquestion";

export interface IExaminationRepository extends IBaseRepository<any> {
    // Implement examination logic here.

    getExaminationByInstructorId: (instructor_id: string) => Promise<IExamination[] | null>
    addExaminationQuestion: (id: string, payload: Omit<IQuestion, '_id'>) => Promise<IExamination | null>
    updateQuestion: (id: string, question_id: string, payload: Partial<IQuestion>) => Promise<IExamination | null>
    deleteQuestion: (id: string, question_id: string) => Promise<IExamination | null>
    addNestedQuestion: (id: string, payload: { question: string; type: string; score: number; questions: IQuestion[] }) => Promise<IExamination | null>
    addQuestionToNestedQuestion: (examId: string, parentQuestionId: string, question: Omit<IQuestion, "_id">) => Promise<IExamination | null>
    removeQuestionFromNestedQuestion: (examId: string, parentQuestionId: string, nestedQuestionId: string) => Promise<IExamination | null>
    resultSubmit: (examId: string, answers: Answer[]) => Promise<ExamResult>
}