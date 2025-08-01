import { IExamination } from "../../core/examination/model/interface/iexamination";
import { IExaminationSchedule } from "../../core/examination/model/interface/iexamination-schedule";
import { IQuestion } from "../../core/examination/model/interface/iquestion";
import { ExaminationScheduleService } from "../../core/examination/service/exam-schedule.service";
import { ExaminationService } from "../../core/examination/service/exam.service";
import { IExaminationScheduleService } from "../../core/examination/service/interface/iexam-schedule.service";
import { IExaminationService } from "../../core/examination/service/interface/iexam.service";
import { IInstructor } from "../../core/user/model/interface/iintructor";
import { InstructorService } from "../../core/user/service/instructor.service";
import { StudentService } from "../../core/user/service/student.service";
import { UserServiceFactory } from "../../core/user/service/user.factory";
import { Answer } from "../../types/exam";
import { UserRole } from "../../types/user";
import { IExaminationController } from "./interface/iexam.controller";
import { BankService } from "../../core/bank/service/bank.service";

export class ExaminationController implements IExaminationController {
    private _service: IExaminationService
    private _scheduleService: IExaminationScheduleService
    private _bankService: BankService

    constructor() {
        this._service = new ExaminationService()
        this._scheduleService = new ExaminationScheduleService()
        this._bankService = new BankService()
    }

    private _response<T>(message: string, code: number, data: T) {
        return {
            message,
            code,
            data
        }
    }

    /**
     * Removes sensitive data from examination objects based on user role
     * @param exam Examination object or array of examination objects
     * @param user The user making the request
     * @returns Sanitized examination object(s) with role-based answer visibility
     */
    private _sanitizeExamData(exam: IExamination | IExaminationSchedule | IExamination[] | IExaminationSchedule[] | null, user?: IInstructor): any {
        if (!exam) return null;

        const sanitizeExam = (examination: IExamination | IExaminationSchedule) => {
            const sanitized = JSON.parse(JSON.stringify(examination));
            
            if (sanitized.questions && sanitized.questions.length > 0) {
                sanitized.questions = sanitized.questions.map((question: IQuestion) => {
                    if (user && user.role === 'instructor') {
                        return {
                            ...question,
                        };
                    }
                    const sanitizedQuestion = {
                        ...question,
                        choices: question.choices?.map((choice: typeof question.choices[0]) => ({
                            ...choice,
                            isCorrect: "Wow this is correct? LOL",
                            score: "Just do the exam newbie."
                        })),
                        isMultiAnswer: question.choices ? question.choices.filter(choice => choice.isCorrect).length > 1 : false
                    };

                    console.log(sanitizedQuestion)

                    return sanitizedQuestion
                });
            }
            
            return sanitized;
        };

        if (Array.isArray(exam)) {
            return exam.map(e => sanitizeExam(e));
        } else {
            return sanitizeExam(exam);
        }
    }

    async resultSubmit(examId: string, answers: Answer[], scheduleId?: string) {
        // If a scheduleId is provided, use the examination schedule instead of the original exam
        if (scheduleId) {
            try {
                // Get the examination schedule
                const schedule = await this._scheduleService.getExaminationScheduleById(scheduleId);
                
                if (!schedule) {
                    return this._response<null>('Examination schedule not found', 404, null);
                }
                
                // Use the examination service to check the answers against the schedule's questions
                const result = await this._service.resultSubmit(examId, answers, schedule);
                return this._response('Exam submitted successfully', 200, result);
            } catch (error: any) {
                console.error('Error submitting exam with schedule:', error);
                return this._response<null>(`Error submitting exam: ${error.message || 'Unknown error'}`, 500, null);
            }
        } else {
            // Use the original exam if no scheduleId is provided (backward compatibility)
            const result = await this._service.resultSubmit(examId, answers);
            return this._response('Exam submitted successfully', 200, result);
        }
    }

    // Examination-Only methods
    async addExamination(payload: Omit<IExamination, "_id" | "questions">, user: IInstructor, bankId?: string, subBankPath?: string[]) {
        console.log(user)

        
        // Create the exam
        const exam = await this._service.addExamination(payload)
        
        // Update the instructor's exams list
        const service = new UserServiceFactory().createService(user.role)
        const update = (service as InstructorService).updateExam(user._id as unknown as string, exam?._id as unknown as string)
        
        // If bankId is provided, associate the exam with the appropriate bank level
        if (bankId && exam) {
            const examId = exam._id.toString();
            
            try {
                // If subBankPath is provided and valid (not containing just the parent bank ID), add to sub-bank
                if (subBankPath && subBankPath.length > 0 && !(subBankPath.length === 1 && subBankPath[0] === bankId)) {
                    console.log(`Adding exam ${examId} to sub-bank in bank ${bankId} with path:`, subBankPath);
                    await this._bankService.addExamToSubBank(bankId, subBankPath, examId);
                } 
                // Otherwise, add to the parent bank
                else {
                    console.log(`Adding exam ${examId} to parent bank ${bankId}`);
                    await this._bankService.addExamToBank(bankId, examId);
                }
            } catch (error) {
                console.error('Error associating exam with bank:', error);
                // Note: We don't fail the request if bank association fails
            }
        }

        return this._response<typeof exam>('Create Examination Successfully', 200, this._sanitizeExamData(exam, user))
    }

    async getExaminations(user?: IInstructor) {
        const exams = await this._service.getExaminations()
        return this._response<typeof exams>('Done', 200, this._sanitizeExamData(exams, user))
    }

    async getExaminationById(id: string, user?: IInstructor, scheduleId?: string) {
        // If a scheduleId is provided, get the examination schedule instead of the original exam
        if (scheduleId) {
            try {
                const schedule = await this._scheduleService.getExaminationScheduleById(scheduleId);
                
                if (!schedule) {
                    return this._response('Examination schedule not found', 404, null);
                }
                
                return this._response<typeof schedule>('Done', 200, this._sanitizeExamData(schedule, user));
            } catch (error: any) {
                console.error('Error getting examination schedule:', error);
                return this._response(`Error getting examination: ${error.message || 'Unknown error'}`, 500, null);
            }
        } else {
            // Use the original exam if no scheduleId is provided
            const exam = await this._service.getExaminationById(id);
            return this._response<typeof exam>('Done', 200, this._sanitizeExamData(exam, user));
        }
    }

    async getExaminationScheduleById(id: string) {
        try {
            const schedule = await this._scheduleService.getExaminationScheduleById(id);
            
            if (!schedule) {
                return this._response('Examination schedule not found', 404, null);
            }
            
            return this._response<typeof schedule>('Done', 200, schedule);
        } catch (error: any) {
            console.error('Error getting examination schedule:', error);
            return this._response(`Error getting examination schedule: ${error.message || 'Unknown error'}`, 500, null);
        }
    }

    async getExaminationByInstructorId (instructor_id: string, user?: IInstructor) {
        const exams = await this._service.getExaminationByInstructorId(instructor_id)
        return this._response<typeof exams>('Done', 200, this._sanitizeExamData(exams, user))
    }

    async updateExamination(id: string, payload: Partial<IExamination>, user?: IInstructor) {

        
        const updated = await this._service.updateExamination(id, payload)
        return this._response<typeof updated>('Update Examination Successfully', 200, this._sanitizeExamData(updated, user))
    }



    // Question-Only methods
    async addExaminationQuestion(id: string, payload: Omit<IQuestion, '_id'>, user?: IInstructor) {
        const exam = await this._service.addExaminationQuestion(id, payload)
        return this._response<typeof exam>('Add Question Successfully', 200, this._sanitizeExamData(exam, user))
    }

    async updateQuestion(id: string, question_id: string, payload: Partial<IQuestion>, user?: IInstructor) {
        const exam = await this._service.updateQuestion(id, question_id, payload)
        return this._response<typeof exam>('Update Question Successfully', 200, this._sanitizeExamData(exam, user))
    }

    async deleteQuestion (id: string, question_id: string, user?: IInstructor){
        const exam = await this._service.deleteQuestion(id, question_id)
        return this._response<typeof exam>('Delete Question Successfully', 200, this._sanitizeExamData(exam, user))
    }

    async deleteBulkQuestions(id: string, question_ids: string[], user?: IInstructor) {
        const exam = await this._service.deleteBulkQuestions(id, question_ids)
        return this._response<typeof exam>(`${question_ids.length} Questions Deleted Successfully`, 200, this._sanitizeExamData(exam, user))
    }

    // Nested Question methods
    async addNestedQuestion(id: string, payload: { question: string; type: string; score: number; questions: IQuestion[] }, user?: IInstructor) {
        const exam = await this._service.addNestedQuestion(id, payload)
       
        return this._response<typeof exam>('Add Nested Question Successfully', 200, this._sanitizeExamData(exam, user))
    }

    async addNestedQuestionFromExisting(examId: string, nestedQuestionData: { question: string; score: number }, questionIds: string[], user?: IInstructor) {
        const exam = await this._service.addNestedQuestionFromExisting(examId, nestedQuestionData, questionIds)
        
        return this._response<typeof exam>('Add Nested Question from Existing Successfully', 200, this._sanitizeExamData(exam, user))
    }

    async verifyExamPassword(scheduleId: string, password: string) {
        try {
            const schedule = await this._scheduleService.getExaminationScheduleById(scheduleId);
            
            if (!schedule) {
                return this._response('Examination schedule not found', 404, null);
            }
            
            // Check if the provided password matches the exam code
            if (schedule.exam_code === password) {
                return this._response('Password verified successfully', 200, { verified: true });
            } else {
                return this._response('Incorrect password', 401, { verified: false });
            }
        } catch (error: any) {
            console.error('Error verifying exam password:', error);
            return this._response(`Error verifying password: ${error.message || 'Unknown error'}`, 500, null);
        }
    }

    async deleteExamination(id: string, user?: IInstructor) {
        try {
            console.log(`Deleting examination ${id} for user ${user?._id || 'unknown'}`);
            
            // First, remove the exam from all banks and sub-banks
            await this._bankService.removeExamFromAllBanks(id);
            console.log(`Removed exam ${id} from all banks and sub-banks`);
            
            // Then delete the examination from the database
            const deletedExam = await this._service.deleteExamination(id);
            console.log(`Deleted examination ${id} from database`);
            
            return this._response('Examination deleted successfully', 200, deletedExam);
        } catch (error: any) {
            console.error('Error deleting examination:', error);
            return this._response(`Error deleting examination: ${error.message || 'Unknown error'}`, 500, null);
        }
    }
}
