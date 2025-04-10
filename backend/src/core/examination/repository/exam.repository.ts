import mongoose from "mongoose";
import { Answer, ExaminationDocument } from "../../../types/exam";
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

        // preparedQuestions.forEach(async (question) => {
        //     await this.removeQuestionFromNestedQuestion(id, result._id.toString(), question._id.toString());
        // })

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


    async resultSubmit(examId: string, answers: Answer[]) {
        // First update the exam with the submitted answers
        const updatedExam = await this._model.findByIdAndUpdate(examId, { $push: { answers: answers } }, { new: true }).exec();
        
        // Then check the answers to generate the result
        const result = await this.checkAnswers(examId, answers);
        
        // Format the result to match what the frontend expects
        return {
            totalScore: result.maxPossibleScore,
            obtainedScore: result.totalScore,
            correctAnswers: result.results.filter(r => r.isCorrect).length,
            totalQuestions: result.results.length,
            details: result.results.map(r => ({
                questionId: r.questionId,
                isCorrect: r.isCorrect,
                userAnswer: answers.find(a => a.questionId === r.questionId)?.answers || [],
                correctAnswer: (() => {
                    const question = updatedExam?.questions.find(q => q._id?.toString() === r.questionId);
                    if (!question) return [];
                    
                    if (question.type === 'mc') {
                        return question.choices?.filter(c => c.isCorrect).map(c => c.content) || [];
                    }
                    
                    if (question.type === 'tf') {
                        return [question.isTrue?.toString() || ''];
                    }
                    
                    return [];
                })(),
                score: r.score
            }))
        };
    }

    async checkAnswers(examId: string, submittedAnswers: Answer[]) {
        // Get the examination with questions
        const examination = await this._model.findById(examId).exec();
        if (!examination) {
            throw new Error('Examination not found');
        }

        let totalScore = 0;
        let maxPossibleScore = 0;
        const results = submittedAnswers.map(submittedAnswer => {
            // Find the corresponding question
            const question = examination.questions.find(q => q._id?.toString() === submittedAnswer.questionId);
            if (!question) {
                return {
                    questionId: submittedAnswer.questionId,
                    isCorrect: false,
                    score: 0,
                    maxScore: 0,
                    feedback: 'Question not found'
                };
            }

            maxPossibleScore += question.score;
            let isCorrect = false;
            let earnedScore = 0;
            let feedback = '';

            switch (question.type) {
                case 'mc': // Multiple Choice
                    if (question.choices) {
                        const correctChoices = question.choices
                            .filter(choice => choice.isCorrect)
                            .map(choice => choice.content);
                        
                        isCorrect = submittedAnswer.answers.length === correctChoices.length &&
                            submittedAnswer.answers.every(answer => correctChoices.includes(answer));
                        
                        if (isCorrect) {
                            earnedScore = question.score;
                        }
                    }
                    break;

                case 'tf': // True/False
                    isCorrect = submittedAnswer.answers[0] === (question.isTrue ? 'true' : 'false');
                    earnedScore = isCorrect ? question.score : 0;
                    break;

                case 'ses': // Short Essay
                    if (question.expectedAnswer && submittedAnswer.essayAnswer) {
                        // Simple string comparison for short essays
                        isCorrect = submittedAnswer.essayAnswer.toLowerCase().trim() === 
                                  question.expectedAnswer.toLowerCase().trim();
                        earnedScore = isCorrect ? question.score : 0;
                    }
                    break;

                case 'les': // Long Essay
                    if (question.expectedAnswer && submittedAnswer.essayAnswer) {
                        // For long essays, we might want to implement more sophisticated checking
                        // This is a basic implementation
                        const wordCount = submittedAnswer.essayAnswer.split(/\s+/).length;
                        const meetsWordCount = !question.maxWords || wordCount <= question.maxWords;
                        
                        // Basic keyword matching
                        const keywords = question.expectedAnswer.toLowerCase().split(/\s+/);
                        const answerWords = submittedAnswer.essayAnswer.toLowerCase().split(/\s+/);
                        const matchedKeywords = keywords.filter(keyword => 
                            answerWords.some(word => word.includes(keyword))
                        );
                        
                        const keywordScore = (matchedKeywords.length / keywords.length) * question.score;
                        earnedScore = meetsWordCount ? keywordScore : 0;
                        isCorrect = earnedScore > 0;
                    }
                    break;

                case 'nested': // Nested Questions
                    if (question.questions && submittedAnswer.answers.length === question.questions.length) {
                        const nestedResults = question.questions.map((nestedQ, index) => {
                            const nestedAnswer = submittedAnswer.answers[index];
                            // Recursive checking for nested questions
                            // This is a simplified version
                            isCorrect = nestedAnswer === nestedQ.expectedAnswer;
                            earnedScore = isCorrect ? nestedQ.score : 0;
                            return { isCorrect, earnedScore };
                        });
                        
                        earnedScore = nestedResults.reduce((sum, result) => sum + result.earnedScore, 0);
                        isCorrect = earnedScore > 0;
                    }
                    break;
            }

            totalScore += earnedScore;

            return {
                questionId: submittedAnswer.questionId,
                isCorrect,
                score: earnedScore,
                maxScore: question.score,
                feedback: isCorrect ? 'Correct' : 'Incorrect'
            };
        });

        return {
            totalScore,
            maxPossibleScore,
            percentage: (totalScore / maxPossibleScore) * 100,
            results
        };
    }
}