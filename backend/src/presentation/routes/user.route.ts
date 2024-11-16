import Elysia, { t } from "elysia";
import { UserController } from "../controllers/user.controller";
import { tokenVerifier } from "../middleware/token-verify.middleware";
import { updateCategorySchema, updateUserSchema } from "./schema/user.schema";

export const UserRoute = new Elysia({ prefix: '/user' })
    .derive(() => { return { controller: new UserController() } })
    .use(tokenVerifier)
    .group('', (app) => 
        app
            .get('', async ({ controller }) => await controller.getUsers())
            .get('/:id', async ({ params, controller }) => await controller.getUser(params.id))
            .get('/category/:id', async ({ params, controller }) => await controller.getCategory(params.id))
            .patch('/:id', async ({ params, body, controller }) => await controller.updateUser(params.id, body), {
                body: updateUserSchema
            })
            .patch('/examination/:id', async ({ params, user, controller }) => await controller.updateExamBank(user._id as unknown as string, params.id))
            .patch('/category', async ({ body, user, controller }) => await controller.updateCategory(user._id as unknown as string, body), {
                body: updateCategorySchema
            })
            .delete('/:id', async ({ params, controller }) => await controller.deleteUser(params.id))
    )