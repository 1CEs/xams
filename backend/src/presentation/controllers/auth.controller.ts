import Elysia, { t } from "elysia";
import { SignUpBody, SignInBody } from "../../types/user";
import { UserServiceFactory } from "../../core/user/service/user.service";
import { UserRepoFactory } from "../../core/user/repository/user-repo";
import { SignInSchema, SignUpSchema } from "../schema/auth.schema";

export const AuthController = new Elysia({ prefix: '/auth' })
    .post('/sign-up', ({ body }: { body: SignUpBody }) => body, {
        body: SignUpSchema,
        afterHandle: async (ctx) => {
            const { body } = ctx
            const userBody = body
            if (userBody.role == 'student') {
                const userService = new UserServiceFactory(new UserRepoFactory).createService(userBody.role)
                const result = await userService.saveService(userBody)
                return result
            }
            return userBody
        }
    })
    .post('/sign-in', ({ body }: { body: SignInBody }) => body, {
        body: SignInSchema,
        afterHandle: async (ctx) => {
            const { body } = ctx
            const userBody = body as SignInBody
            console.log(userBody)
        }
    })