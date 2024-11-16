import Elysia, { t } from "elysia";
import { ExaminationController } from "../controllers/exam.controller";
import { tokenVerifier } from "../middleware/token-verify.middleware";
import { AddExaminationSchema, updateExaminationSchema } from "./schema/exam.schema";
import { IInstructor } from "../../core/user/model/interface/iintructor";

export const ExamRoute = new Elysia({ prefix: '/exam' })
    .derive(() => { 
        return { controller : new ExaminationController() } 
    })
    .use(tokenVerifier)
    .group('', (app) => 
        app
            // Examination-Only routes
            .get('', async ({ controller }) => await controller.getExaminations())
            .get('/:id', async ({ params, controller }) => await controller.getExaminationById(params.id))
            .get('', async ({ query, controller }) => await controller.getExaminationByInstructorId(query.instructor_id), {
                query: t.Object({
                    instructor_id: t.String()
                })
            })
            .post('', async ({ body, user, controller }) => await controller.addExamination({ ...body, instructor_id: user._id as unknown as string }, user as IInstructor), {
                body: AddExaminationSchema
            })
            .patch('/:id', async ({ params, body, controller }) => await controller.updateExamination(params.id, body), {
                body: updateExaminationSchema
            })
            .delete('/:id', async ({ params, controller }) => await controller.deleteExamination(params.id))

            // Question-Only routes
            .patch('/question', async ({ user, controller }) => {})
    )
