import Elysia, { t } from "elysia";
import { ExaminationController } from "../controllers/exam.controller";
import { tokenVerifier } from "../middleware/token-verify.middleware";
import { catchAsync } from "../../utils/error";
import { Context } from "elysia";

type ExamScheduleContext = Context & {
    controller: ExaminationController;
}

export const ExamScheduleRoute = new Elysia({ prefix: '/exam-schedule' })
    .derive(() => { 
        return { controller : new ExaminationController() } 
    })
    .use(tokenVerifier)
    .group('', (app) => 
        app
            // Get exam schedule by ID
            .get('/:id', catchAsync(async ({ params, controller }: ExamScheduleContext & { params: { id: string } }) => 
                await controller.getExaminationScheduleById(params.id)))
            
            // Verify exam password
            .post('/:id/verify', catchAsync(async ({ params, body, controller }: ExamScheduleContext & { 
                params: { id: string }, 
                body: { password: string } 
            }) => await controller.verifyExamPassword(params.id, body.password)), {
                body: t.Object({
                    password: t.String()
                })
            })
    )
