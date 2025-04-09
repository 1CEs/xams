import Elysia, { t } from "elysia";
import { ExaminationController } from "../controllers/exam.controller";
import { tokenVerifier } from "../middleware/token-verify.middleware";
import { AddExaminationSchema, QuestionFormSchema, NestedQuestionSchema, updateExaminationSchema } from "./schema/exam.schema";
import { IInstructor } from "../../core/user/model/interface/iintructor";
import { catchAsync } from "../../utils/error";
import { Static } from "@sinclair/typebox";
import { Context } from "elysia";

type ExamContext = Context & {
    controller: ExaminationController;
    user: IInstructor;
}

type AddExamBody = Static<typeof AddExaminationSchema>
type QuestionBody = Static<typeof QuestionFormSchema>
type NestedQuestionBody = Static<typeof NestedQuestionSchema>
type UpdateExamBody = Static<typeof updateExaminationSchema>

export const ExamRoute = new Elysia({ prefix: '/exam' })
    .derive(() => { 
        return { controller : new ExaminationController() } 
    })
    .use(tokenVerifier)
    .group('', (app) => 
        app
            // Examination-Only routes
            .get('', catchAsync(async ({ controller, user }: ExamContext) => await controller.getExaminations(user)))
            .get('/:id', catchAsync(async ({ params, controller, user }: ExamContext & { params: { id: string } }) => await controller.getExaminationById(params.id, user)))
            .get('', catchAsync(async ({ query, controller, user }: ExamContext & { query: { instructor_id: string } }) => await controller.getExaminationByInstructorId(query.instructor_id, user)), {
                query: t.Object({
                    instructor_id: t.String()
                })
            })
            .post('', catchAsync(async ({ body, user, controller }: ExamContext & { body: AddExamBody }) => await controller.addExamination({ ...body, instructor_id: user._id as unknown as string, category: body.category || [] }, user)), {
                body: AddExaminationSchema
            })
            .post('/verify', catchAsync(async ({ query, controller, user }: ExamContext & { query: { examination_id: string, group_id: string, password: string } }) => await controller.verifyPassword(query.examination_id, query.group_id, query.password, user)), {
                query: t.Object({
                    examination_id: t.String(),
                    group_id: t.String(),
                    password: t.String()
                })
            })
            .patch('/:id', catchAsync(async ({ params, body, controller, user }: ExamContext & { params: { id: string }, body: UpdateExamBody }) => await controller.updateExamination(params.id, body, user)), {
                body: updateExaminationSchema
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
            
            // Nested Question routes
            .post('/nested-question/:id', catchAsync(async ({ params, body, controller, user }: ExamContext & { params: { id: string }, body: NestedQuestionBody }) => await controller.addNestedQuestion(params.id, body, user)), {
                body: NestedQuestionSchema
            })
    )
