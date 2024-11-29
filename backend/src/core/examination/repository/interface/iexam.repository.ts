

import { IBaseRepository } from "../../../base/interface/ibase.repository";
import { IExamination } from "../../model/interface/iexamination";
import { IQuestion } from "../../model/interface/iquestion";

export interface IExaminationRepository extends IBaseRepository<IExamination> {
    // Implement examination logic here.

    getExaminationByInstructorId: (instructor_id: string) => Promise<IExamination[] | null>
    addExaminationQuestion: (id: string, payload: Omit<IQuestion, '_id'>) => Promise<IExamination | null>
    updateQuestion: (id: string, question_id: string, payload: Partial<IQuestion>) => Promise<IExamination | null>
    deleteQuestion: (id: string, question_id: string) => Promise<IExamination | null>
}