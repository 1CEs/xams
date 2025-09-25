import Elysia, { t } from "elysia";
import { ExaminationController } from "../controllers/exam.controller";
import { tokenVerifier } from "../middleware/token-verify.middleware";
import { AddExaminationSchema, QuestionFormSchema, NestedQuestionSchema, NestedQuestionFromExistingSchema, updateExaminationSchema, UpdateNestedQuestionSchema, UpdateSubQuestionSchema } from "./schema/exam.schema";
import { IInstructor } from "../../core/user/model/interface/iintructor";
import { catchAsync } from "../../utils/error";
import { Static } from "@sinclair/typebox";
import { Context } from "elysia";
import { Answer, SubmitAnswer } from "../../types/exam";

type ExamContext = Context & {
    controller: ExaminationController;
    user: IInstructor | any;
}

type AddExamBody = Static<typeof AddExaminationSchema> & { bankId?: string, subBankPath?: string[] }
type QuestionBody = Static<typeof QuestionFormSchema>
type NestedQuestionBody = Static<typeof NestedQuestionSchema>
type NestedQuestionFromExistingBody = Static<typeof NestedQuestionFromExistingSchema>
type UpdateExamBody = Static<typeof updateExaminationSchema>
type UpdateNestedQuestionBody = Static<typeof UpdateNestedQuestionSchema>
type UpdateSubQuestionBody = Static<typeof UpdateSubQuestionSchema>

export const ExamRoute = new Elysia({ prefix: '/exam' })
    .derive(() => { 
        return { controller : new ExaminationController() } 
    })
    .use(tokenVerifier)
    .group('', (app) => 
        app
            // Examination-Only routes
            .get('', catchAsync(async ({ controller, user }: ExamContext) => await controller.getExaminations(user)))
            .get('/all', catchAsync(async ({ controller, user }: ExamContext) => await controller.getExaminations(user)))
            .get('/by-instructor', catchAsync(async ({ query, controller, user }: ExamContext & { query: { instructor_id: string } }) => await controller.getExaminationByInstructorId(query.instructor_id, user)), {
                query: t.Object({
                    instructor_id: t.String()
                })
            })
            .get('/:id', catchAsync(async ({ params, query, controller, user }: ExamContext & { params: { id: string }, query: { schedule_id?: string } }) => 
                await controller.getExaminationById(params.id, user, query.schedule_id)), {
                query: t.Object({
                    schedule_id: t.Optional(t.String())
                })
            })
            .get('/schedule/:id', catchAsync(async ({ params, controller }: ExamContext & { params: { id: string } }) => 
                await controller.getExaminationScheduleById(params.id)))
            .post('', catchAsync(async ({ body, user, controller }: ExamContext & { body: AddExamBody }) => await controller.addExamination({ ...body, instructor_id: user._id as unknown as string }, user, body.bankId, body.subBankPath)), {
                body: AddExaminationSchema
            })
            .put('/:id', catchAsync(async ({ params, body, controller, user }: ExamContext & { params: { id: string }, body: UpdateExamBody }) => await controller.updateExamination(params.id, body, user)), {
                body: updateExaminationSchema
            })
            .put('/question/:exam_id/:question_id', catchAsync(async ({ params, body, controller, user }: ExamContext & { params: { exam_id: string, question_id: string }, body: QuestionBody }) => await controller.updateQuestion(params.exam_id, params.question_id, body, user)), {
                body: QuestionFormSchema
            })
            .delete('/:id', catchAsync(async ({ params, controller, user }: ExamContext & { params: { id: string } }) => await controller.deleteExamination(params.id, user)))

            // Question-Only routes
            .post('/question/:id', catchAsync(async ({ params, body, controller, user }: ExamContext & { params: { id: string }, body: QuestionBody }) => await controller.addExaminationQuestion(params.id, body, user)), {
                body: QuestionFormSchema
            })
            .delete('/question', catchAsync(async({ query, controller }: ExamContext & { query: { examination_id: string, question_id: string } }) => await controller.deleteQuestion(query.examination_id, query.question_id)),
                {
                    query: t.Object({
                        examination_id: t.String(),
                        question_id: t.String()
                    })
            })
            .delete('/questions/bulk', catchAsync(async({ body, controller, user }: ExamContext & { body: { examination_id: string, question_ids: string[] } }) => await controller.deleteBulkQuestions(body.examination_id, body.question_ids, user)), {
                body: t.Object({
                    examination_id: t.String(),
                    question_ids: t.Array(t.String())
                })
            })
            
            // Nested Question routes
            .post('/nested-question/:id', catchAsync(async ({ params, body, controller, user }: ExamContext & { params: { id: string }, body: NestedQuestionBody }) => await controller.addNestedQuestion(params.id, body, user)), {
                body: NestedQuestionSchema
            })
            .post('/nested-question-from-existing/:id', catchAsync(async ({ params, body, controller, user }: ExamContext & { params: { id: string }, body: NestedQuestionFromExistingBody }) => await controller.addNestedQuestionFromExisting(params.id, body.nestedQuestionData, body.questionIds, user)), {
                body: NestedQuestionFromExistingSchema
            })
            .put('/nested-question/:exam_id/:question_id', catchAsync(async ({ params, body, controller, user }: ExamContext & { params: { exam_id: string, question_id: string }, body: UpdateNestedQuestionBody }) => await controller.updateNestedQuestion(params.exam_id, params.question_id, body, user)), {
                body: UpdateNestedQuestionSchema
            })
            .put('/nested-question/:exam_id/:question_id/sub-question/:sub_question_id', catchAsync(async ({ params, body, controller, user }: ExamContext & { params: { exam_id: string, question_id: string, sub_question_id: string }, body: UpdateSubQuestionBody }) => await controller.updateSubQuestion(params.exam_id, params.question_id, params.sub_question_id, body, user)), {
                body: UpdateSubQuestionSchema
            })

            // Result-Only routes
            .post('/submit', catchAsync(async ({ body, controller }: ExamContext & { body: SubmitAnswer & { schedule_id?: string } }) => 
                await controller.resultSubmit(body.exam_id, body.answers, body.schedule_id)), {
                body: t.Object({
                    exam_id: t.String(),
                    schedule_id: t.Optional(t.String()),
                    answers: t.Array(t.Object({
                        questionId: t.String(),
                        answers: t.Array(t.String()),
                        essayAnswer: t.Optional(t.String())
                    }))
                })
            })
    )
