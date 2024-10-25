import Elysia from "elysia";
import { AuthController } from "../controllers/auth.controller";

export const indexRouter = new Elysia({ prefix: '/api' })
    .use(AuthController)