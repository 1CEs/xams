import Elysia from "elysia";
import { AuthController } from "../controllers/auth.controller";
import { ExamController } from "../controllers/exam.controller";

export const indexRouter = new Elysia({ prefix: '/api' })
    .use(AuthController)
    .use(ExamController)