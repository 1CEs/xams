import Elysia from "elysia"
import { AuthController } from "../controllers/auth.controller"
import { SignUpSchema } from "./schema/sign-up.schema"
import { SignInSchema } from "./schema/sign-in.schema"
import { JWT } from "../middleware/jwt.middleware"
import { tokenVerifier } from "../middleware/token-verify.middleware"

export const AuthRoute = new Elysia({ prefix: '/auth' })
    .use(JWT)
    .decorate('controller', new AuthController())
    .post('/sign-up', async ({
        controller,
        body,
        cookie: { accessToken, refreshToken },
        jwt
    }) => await controller.signup({ body, accessToken, refreshToken, jwt }),
        {
            body: SignUpSchema,
        })
    .post('/sign-in', async ({
        controller,
        body,
        cookie: { accessToken, refreshToken },
        jwt
    }) => await controller.signin({ body, accessToken, refreshToken, jwt }), {
        body: SignInSchema,
    })
    .use(tokenVerifier)
    .get('/me', ({ controller, user }) => controller.me(user))