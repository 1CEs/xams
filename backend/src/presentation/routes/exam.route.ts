import Elysia from "elysia";
import { ExaminationController } from "../controllers/exam.controller";
import { tokenVerifier } from "../middleware/token-verify.middleware";
import { AddExaminationSchema, updateExaminationSchema } from "./schema/exam.schema";

export const ExamRoute = new Elysia({ prefix: '/exam' })
    .decorate('controller', new ExaminationController())
    .use(tokenVerifier)
    .group('', (app) => 
        app
            // Examination-Only routes
            .get('', async ({ controller }) => await controller.getExaminations())
            .get('/:id', async ({ params, controller }) => await controller.getExaminationById(params.id))
            .post('', async ({ body, controller }) => await controller.addExamination(body), {
                body: AddExaminationSchema
            })
            .patch('/:id', async ({ params, body, controller }) => await controller.updateExamination(params.id, body), {
                body: updateExaminationSchema
            })
            .delete('/:id', ({ params, controller }) => controller.deleteExamination(params.id))

            // Question-Only routes
            .patch('/question', ({ user, controller }) => controller)
    )
