import Elysia from "elysia";
import { AuthController } from "../controllers/auth.controller";
import { SignUpSchema } from "./schema/sign-up.schema";
import { SignInSchema } from "./schema/sign-in.schema";

const ac = new AuthController()
export const AuthRoute = new Elysia({ prefix: '/auth' })
    .post('/sign-up', ({ body }) => ac.signup(body), {
        body: SignUpSchema,
    })
    .post('/sign-in', ({ body }) => ac.signin(body), {
        body: SignInSchema,
    })
    .onError(({ code, error }) => {
        let parsedError
        try {
            parsedError = JSON.parse(error.message)
        } catch (e) {
            parsedError = error.message
        }
        return {
            code,
            err: parsedError
        }
    })