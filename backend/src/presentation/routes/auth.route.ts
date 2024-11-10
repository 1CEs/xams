import Elysia from "elysia"
import { AuthController } from "../controllers/auth.controller"
import { SignUpSchema } from "./schema/sign-up.schema"
import { SignInSchema } from "./schema/sign-in.schema"
import { JWT } from "../middleware/jwt.middleware"
import { tokenVerifier } from "../middleware/token-verify.middleware"

const ac = new AuthController()

export const AuthRoute = new Elysia({ prefix: '/auth' })
    .use(JWT)
    .post('/sign-up', ({
        body,
        cookie: { accessToken, refreshToken },
        jwt
    }) => ac.signup({ body, accessToken, refreshToken, jwt }),
        {
            body: SignUpSchema,
        })
    .post('/sign-in', ({
        body,
        cookie: { accessToken, refreshToken },
        jwt
    }) => ac.signin({ body, accessToken, refreshToken, jwt }), {
        body: SignInSchema,
    })
    .use(tokenVerifier)
    .get('/me', ({ user }) => ac.me(user))