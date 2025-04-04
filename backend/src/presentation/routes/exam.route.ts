import Elysia, { t } from "elysia";
import { ExaminationController } from "../controllers/exam.controller";
import { tokenVerifier } from "../middleware/token-verify.middleware";
import { AddExaminationSchema, QuestionFormSchema, NestedQuestionSchema, updateExaminationSchema } from "./schema/exam.schema";
import { IInstructor } from "../../core/user/model/interface/iintructor";

export const ExamRoute = new Elysia({ prefix: '/exam' })
    .derive(() => { 
        return { controller : new ExaminationController() } 
    })
    .use(tokenVerifier)
    .group('', (app) => 
        app
            // Examination-Only routes
            .get('', async ({ controller, user }) => await controller.getExaminations(user as IInstructor))
            .get('/:id', async ({ params, controller, user }) => await controller.getExaminationById(params.id, user as IInstructor))
            .get('', async ({ query, controller, user }) => await controller.getExaminationByInstructorId(query.instructor_id, user as IInstructor), {
                query: t.Object({
                    instructor_id: t.String()
                })
            })
            .post('', async ({ body, user, controller }) => await controller.addExamination({ ...body, instructor_id: user._id as unknown as string, category: body.category || [] }, user as IInstructor), {
                body: AddExaminationSchema
            })
            .patch('/:id', async ({ params, body, controller, user }) => await controller.updateExamination(params.id, body, user as IInstructor), {
                body: updateExaminationSchema
            })
            .delete('/:id', async ({ params, controller, user }) => await controller.deleteExamination(params.id, user as IInstructor))

            // Question-Only routes
            .post('/question/:id', async ({ params, body, controller, user }) => await controller.addExaminationQuestion(params.id, body, user as IInstructor), {
                body: QuestionFormSchema
            })
            .delete('/question', async({ query, controller }) => await controller.deleteQuestion(query.examination_id as unknown as string, query.question_id as unknown as string),
                {
                    query: t.Object({
                        examination_id: t.String(),
                        question_id: t.String()
                    })
            })
            
            // Nested Question routes
            .post('/nested-question/:id', async ({ params, body, controller, user }) => await controller.addNestedQuestion(params.id, body, user as IInstructor), {
                body: NestedQuestionSchema
            })
    )
