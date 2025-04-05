import mongoose from "mongoose";
import { ExaminationDocument } from "../../../types/exam";
import { BaseRepository } from "../../base/base.repository";
import { ExaminationModel } from "../model/examination.model";
import { IExamination } from "../model/interface/iexamination";
import { IQuestion } from "../model/interface/iquestion";
import { IExaminationRepository } from "./interface/iexam.repository";

export class ExaminationRepository
    extends BaseRepository<ExaminationDocument>
    implements IExaminationRepository {

    constructor() {
        super(ExaminationModel)
    }

    async getExaminationByInstructorId(instructor_id: string) {
        const result = await this._model.find({ instructor_id }).exec()
        return result
    }

    async addExaminationQuestion(id: string, payload: Omit<IQuestion, "_id">) {
        const result = await this._model.findByIdAndUpdate(id, { $push: { questions: payload } }, { new: true }).exec()
        return result
    }

    async updateQuestion(id: string, question_id: string, payload: Partial<IQuestion>) {
        const result = await this._model.findOneAndUpdate(
            { _id: id, 'questions._id': question_id },
            { $set: { "questions.$": payload } },
            { new: true }
        ).exec()
        return result
    }

    async deleteQuestion(id: string, question_id: string) {
        const result = await this._model.findOneAndUpdate(
            { _id: new mongoose.Types.ObjectId(id) },
            { $pull: { questions: { _id: new mongoose.Types.ObjectId(question_id) } } },
            { new: true }
        ).exec();
    
        console.log("Updated Document:", result);
        return result;
    }

    // Nested Question methods
    async addNestedQuestion(id: string, payload: { question: string; type: string; score: number; questions: IQuestion[] }) {
        // Prepare nested questions with appropriate default values
        const preparedQuestions = payload.questions.map(q => {
            // Create a new object with required fields
            const baseQuestion: any = {
                question: q.question,
                type: q.type,
                score: q.score,
                choices: [],
                isTrue: false,
                expectedAnswer: '',
                maxWords: 0
            };

            // Add type-specific fields
            if (q.type === 'mc') {
                baseQuestion.choices = q.choices || [];
            } else if (q.type === 'tf') {
                baseQuestion.isTrue = q.isTrue !== undefined ? q.isTrue : false;
            } else if (q.type === 'ses') {
                baseQuestion.expectedAnswer = q.expectedAnswer || '';
            } else if (q.type === 'les') {
                baseQuestion.expectedAnswer = q.expectedAnswer || '';
                baseQuestion.maxWords = q.maxWords || 0;
            }

            return baseQuestion;
        });

        // Create the nested question structure
        const nestedQuestion = {
            question: payload.question,
            type: 'nested',
            score: payload.score,
            questions: preparedQuestions,
            choices: [],
            isTrue: false,
            expectedAnswer: '',
            maxWords: 0
        };

        // Add the new nested question to the examination
        const result = await this._model.findByIdAndUpdate(
            id,
            { $push: { questions: nestedQuestion } },
            {
                new: true,
                runValidators: true,
                setDefaultsOnInsert: true
            }
        ).exec();

        if (!result) {
            throw new Error(`Examination with ID ${id} not found`);
        }

        preparedQuestions.forEach(async (question) => {
            await this.removeQuestionFromNestedQuestion(id, result._id.toString(), question._id.toString());
        })

        return result;

    }

    async removeQuestionFromNestedQuestion(examId: string, parentQuestionId: string, nestedQuestionId: string) {
        const result = await this._model.findOneAndUpdate(
            {
                _id: examId,
                'questions._id': parentQuestionId,
                'questions.type': 'nested'
            },
            {
                $pull: {
                    'questions.$.questions': { _id: nestedQuestionId }
                }
            },
            { new: true }
        ).exec();
        return result;
    }

    async addQuestionToNestedQuestion(examId: string, parentQuestionId: string, question: Omit<IQuestion, "_id">) {
        const result = await this._model.findOneAndUpdate(
            {
                _id: examId,
                'questions._id': parentQuestionId,
                'questions.type': 'nested'
            },
            {
                $push: {
                    'questions.$.questions': question
                }
            },
            { new: true }
        ).exec();
        return result;
    }


}