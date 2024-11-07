import Elysia from "elysia";
import { AuthController } from "../controllers/auth.controller";
import { SignUpSchema } from "./schema/sign-up.schema";
import { SignInSchema } from "./schema/sign-in.schema";

const ac = new AuthController()
export const AuthRoute = new Elysia({ prefix: '/auth' })
    .post('/sign-up', ({ body }) => ac.signup(body as any), {
        body: SignUpSchema,
        error({ code, error }) {
            console.log(error)
        }
    })
    .post('/sign-in', ({ body }) => ac.signin(body), {
        body: SignInSchema
    })