import { IExamination } from "../../core/examination/model/interface/iexamination";
import { IQuestion } from "../../core/examination/model/interface/iquestion";
import { ExaminationService } from "../../core/examination/service/exam.service";
import { IExaminationService } from "../../core/examination/service/interface/iexam.service";
import { IInstructor } from "../../core/user/model/interface/iintructor";
import { InstructorService } from "../../core/user/service/instructor.service";
import { UserServiceFactory } from "../../core/user/service/user.factory";
import { IExaminationController } from "./interface/iexam.controller";
import { publicEncrypt, privateDecrypt } from "crypto";

// Encrypt message using public key
const encryptRSA = (message: string, pubKey: string): string => {
  const messageBuffer = new TextEncoder().encode(message);
  const encryptedBuffer = publicEncrypt(pubKey, messageBuffer);
  return encryptedBuffer.toString("base64");
};

// Decrypt message using private key
const decryptRSA = (encryptedMessage: string, privKey: string): string => {
  const encryptedBuffer = Buffer.from(encryptedMessage, 'base64');
  const decryptedBuffer = privateDecrypt(privKey, new Uint8Array(encryptedBuffer));
  return decryptedBuffer.toString('utf8');
};

export class ExaminationController implements IExaminationController {
    private _service: IExaminationService

    constructor() {
        this._service = new ExaminationService()
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
    private _sanitizeExamData(exam: IExamination | IExamination[] | null, user?: IInstructor): any {
        if (!exam) return null;

        const sanitizeExam = (examination: IExamination) => {
            const sanitized = JSON.parse(JSON.stringify(examination));
            
            if (sanitized.questions && sanitized.questions.length > 0) {
                sanitized.questions = sanitized.questions.map((question: IQuestion) => {
                    if (user && user.role === 'instructor') {
                        return {
                            ...question,
                        };
                    }
                    
                    return {
                        ...question,
                        hasAnswers: (question.type === 'mc' && question.choices?.some(c => c.isCorrect)) || 
                                  (question.type === 'tf' && question.isTrue !== undefined) ||
                                  (['ses', 'les'].includes(question.type) && question.expectedAnswer !== undefined),
                        answer: encryptRSA(
                            (question.type === 'mc' ? question.choices?.filter(c => c.isCorrect).length.toString() :
                            question.type === 'tf' ? question.isTrue?.toString() :
                            question.expectedAnswer?.length.toString()) || '0',
                            process.env.PUBLIC_KEY as string
                        )
                    };
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

    // Examination-Only methods
    async addExamination(payload: Omit<IExamination, "_id" | "questions">, user: IInstructor) {
        console.log(user)
        // Ensure category is set, default to empty array if not provided
        if (!payload.category) {
            payload.category = []
        }
        
        const exam = await this._service.addExamination(payload)
        const service = new UserServiceFactory().createService(user.role)

        const update = (service as InstructorService).updateExam(user._id as unknown as string, exam?._id as unknown as string)

        return this._response<typeof exam>('Create Examination Successfully', 200, this._sanitizeExamData(exam, user))
    }

    async getExaminations(user?: IInstructor) {
        const exams = await this._service.getExaminations()
        return this._response<typeof exams>('Done', 200, this._sanitizeExamData(exams, user))
    }

    async getExaminationById(id: string, user?: IInstructor) {
        const exam = await this._service.getExaminationById(id)
        return this._response<typeof exam>('Done', 200, this._sanitizeExamData(exam, user))
    }

    async getExaminationByInstructorId (instructor_id: string, user?: IInstructor) {
        const exams = await this._service.getExaminationByInstructorId(instructor_id)
        return this._response<typeof exams>('Done', 200, this._sanitizeExamData(exams, user))
    }

    async updateExamination(id: string, payload: Partial<IExamination>, user?: IInstructor) {
        // If category is provided but null, set it to an empty array
        if (payload.hasOwnProperty('category') && !payload.category) {
            payload.category = []
        }
        
        const updated = await this._service.updateExamination(id, payload)
        return this._response<typeof updated>('Update Examination Successfully', 200, this._sanitizeExamData(updated, user))
    }

    async deleteExamination(id: string, user?: IInstructor) {
        const deleted = await this._service.deleteExamination(id)
        return this._response<typeof deleted>('Delete Examination Successfully', 200, this._sanitizeExamData(deleted, user))
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
}
