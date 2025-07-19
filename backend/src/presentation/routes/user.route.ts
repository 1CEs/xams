import Elysia, { t } from "elysia";
import { UserController } from "../controllers/user.controller";
import { tokenVerifier } from "../middleware/token-verify.middleware";
import { updateCategorySchema, updateUserSchema } from "./schema/user.schema";
import { catchAsync } from "../../utils/error";
import { Static } from "@sinclair/typebox";
import { Context } from "elysia";

type UserContext = Context & {
    controller: UserController;
    user?: any;
}

type UpdateUserBody = Static<typeof updateUserSchema>
type UpdateCategoryBody = Static<typeof updateCategorySchema>

export const UserRoute = new Elysia({ prefix: '/user' })
    .derive(() => { return { controller: new UserController() } })
    .use(tokenVerifier)
    .group('', (app) => 
        app
            .get('', catchAsync(async ({ controller }: UserContext) => await controller.getUsers()))
            .get('/:id', catchAsync(async ({ params, controller }: UserContext & { params: { id: string } }) => await controller.getUser(params.id)))
            .get('/category/:id', catchAsync(async ({ params, controller }: UserContext & { params: { id: string } }) => await controller.getCategory(params.id)))
            .get('/bank/:id', catchAsync(async ({ params, controller }: UserContext & { params: { id: string } }) => await controller.getBank(params.id)))
            .patch('/:id', catchAsync(async ({ params, body, controller }: UserContext & { params: { id: string }, body: UpdateUserBody }) => await controller.updateUser(params.id, body)), {
                body: updateUserSchema
            })
            .patch('/examination/:id', catchAsync(async ({ params, user, controller }: UserContext & { params: { id: string } }) => await controller.updateExamBank(user._id as unknown as string, params.id)))
            .patch('/category', catchAsync(async ({ body, user, controller }: UserContext & { body: UpdateCategoryBody }) => await controller.updateCategory(user._id as unknown as string, body)), {
                body: updateCategorySchema
            })
            .delete('/:id', catchAsync(async ({ params, controller }: UserContext & { params: { id: string } }) => await controller.deleteUser(params.id)))
    )