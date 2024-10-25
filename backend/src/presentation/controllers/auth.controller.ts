import Elysia, { t } from "elysia";
import { SignUpBody } from "../../types/user";
import { UserServiceFactory } from "../../core/user/service/user.service";
import { UserRepoFactory } from "../../core/user/repository/user-repo";
import { SignUpSchema } from "../schema/auth.schema";

export const AuthController = (app: Elysia) => {
    app.post('/sign-up', ({ body }: { body: SignUpBody }) => body, {
        body: SignUpSchema,
        afterHandle: async (ctx) => {
            const { body } = ctx
            const userBody = body as SignUpBody
            if (userBody.role == 'student') {
                const payload = {
                    ...userBody,
                }
                const userService = new UserServiceFactory(new UserRepoFactory).createService(userBody.role)
                const result = await userService.saveService(userBody)
                return result
            }
        }
    })

    return Promise.resolve(app)
}