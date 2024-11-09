import Elysia from "elysia";
import { AuthController } from "../controllers/auth.controller";
import { SignUpSchema } from "./schema/sign-up.schema";
import { SignInSchema } from "./schema/sign-in.schema";
import jwt from "@elysiajs/jwt";

const ac = new AuthController()

export const AuthRoute = new Elysia({ prefix: '/auth' })
    .use(jwt({
        name: 'jwt',
        secret: process.env.JWT_SECRET!,
        alg: 'HS512'
    }))
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