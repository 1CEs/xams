import Elysia, { t } from "elysia"
import { AuthController } from "../controllers/auth.controller"
import { SignUpSchema } from "./schema/sign-up.schema"
import { SignInSchema } from "./schema/sign-in.schema"
import { JWT } from "../middleware/jwt.middleware"
import { tokenVerifier } from "../middleware/token-verify.middleware"
import { catchAsync } from "../../utils/error"
import { Context } from "elysia"
import { JWTPayloadSpec } from "@elysiajs/jwt"
import { Static } from "@sinclair/typebox"
import { passwordRegex } from "../../utils/regex"

type AuthContext = Context & { 
    controller: AuthController;
    jwt: {
        sign: (payload: JWTPayloadSpec) => Promise<string>;
        verify: (token: string) => Promise<JWTPayloadSpec>;
    };
    user?: any;
}

type SignUpBody = Static<typeof SignUpSchema>
type SignInBody = Static<typeof SignInSchema>

export const AuthRoute = new Elysia({ prefix: '/auth' })
    .use(JWT)
    .decorate('controller', new AuthController())
    .post('/sign-up', async ({
        controller,
        body,
        cookie: { accessToken, refreshToken },
        jwt,
        set
    }: AuthContext & { body: SignUpBody }) => {
        const result = await controller.signup({ body, accessToken, refreshToken, jwt });
        
        // If it's an error response, set the HTTP status code
        if (!result.success && result.code) {
            set.status = result.code;
        }
        
        return result;
    },
        {
            body: SignUpSchema,
        })
    .post('/sign-in', async ({
        controller,
        body,
        cookie: { accessToken, refreshToken },
        jwt
    }: AuthContext & { body: SignInBody }) => await controller.signin({ body, accessToken, refreshToken, jwt }), {
        body: SignInSchema,
    })
    .post('/forgot-password', catchAsync(async ({ body, controller, jwt }: AuthContext & { body: { email: string } }) => await controller.forgotPassword(body.email, jwt)), {
        body: t.Object({
            email: t.String()
        })
    })
    .post('/reset-password', catchAsync(async ({ body, controller, jwt }: AuthContext & { body: { token: string; password: string } }) => await controller.resetPassword(body.token, body.password, jwt)), {
        body: t.Object({
            token: t.String(),
            password: t.String({ pattern: passwordRegex })
        })
    })
    .post('/logout', catchAsync(({ controller, cookie: { accessToken, refreshToken }}: AuthContext) => controller.logout({ accessToken, refreshToken })))
    .use(tokenVerifier)
    .get('/me', catchAsync(({ controller, user }: AuthContext) => controller.me(user)))