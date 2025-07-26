import { Answer, ExamResult } from "../../../../types/exam";
import { IBaseRepository } from "../../../base/interface/ibase.repository";
import { IExamination } from "../../model/interface/iexamination";
import { IExaminationSchedule } from "../../model/interface/iexamination-schedule";
import { IQuestion } from "../../model/interface/iquestion";

export interface IExaminationRepository extends IBaseRepository<any> {
    // Implement examination logic here.

    getExaminationByInstructorId: (instructor_id: string) => Promise<IExamination[] | null>
    addExaminationQuestion: (id: string, payload: Omit<IQuestion, '_id'>) => Promise<IExamination | null>
    updateQuestion: (id: string, question_id: string, payload: Partial<IQuestion>) => Promise<IExamination | null>
    deleteQuestion: (id: string, question_id: string) => Promise<IExamination | null>
    deleteBulkQuestions: (id: string, question_ids: string[]) => Promise<IExamination | null>
    findDuplicateQuestions: (questions: IQuestion[], instructorId?: string) => Promise<{ questionText: string, examId: string, examTitle: string }[]>
    addNestedQuestion: (id: string, payload: { question: string; type: string; score: number; questions: IQuestion[] }) => Promise<IExamination | null>
    addNestedQuestionFromExisting: (examId: string, nestedQuestionData: { question: string; score: number }, questionIds: string[]) => Promise<IExamination | null>
    addQuestionToNestedQuestion: (examId: string, parentQuestionId: string, question: Omit<IQuestion, "_id">) => Promise<IExamination | null>
    removeQuestionFromNestedQuestion: (examId: string, parentQuestionId: string, nestedQuestionId: string) => Promise<IExamination | null>
    resultSubmit: (examId: string, answers: Answer[]) => Promise<ExamResult>
    resultSubmitWithSchedule: (examId: string, answers: Answer[], examSchedule: IExaminationSchedule) => Promise<ExamResult>
}
