import Elysia, { t } from "elysia";
import { UserController } from "../controllers/user.controller";
import { tokenVerifier } from "../middleware/token-verify.middleware";
import { updateUserSchema } from "./schema/user.schema";

export const UserRoute = new Elysia({ prefix: '/user' })
    .decorate('controller', new UserController())
    .use(tokenVerifier)
    .get('', async ({ controller }) => await controller.getUsers())
    .get('/:id', async ({ params, controller }) => await controller.getUser(params.id))
    .patch('/:id', async ({ params, body, controller }) => await controller.updateUser(params.id, body), {
        body: updateUserSchema
    })
    .delete('/:id', async ({ params, controller }) => await controller.deleteUser(params.id))

    