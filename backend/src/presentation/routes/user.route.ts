import Elysia, { t } from "elysia";
import { UserController } from "../controllers/user.controller";
import { tokenVerifier } from "../middleware/token-verify.middleware";
import { updateUserSchema } from "./schema/user.schema";

export const UserRoute = new Elysia({ prefix: '/user' })
    .decorate('controller', new UserController())
    .use(tokenVerifier)
    .get('', ({ controller }) => controller.getUsers())
    .get('/:id', ({ params, controller }) => controller.getUser(params.id))
    .patch('/:id', ({ params, body, controller }) => controller.updateUser(params.id, body), {
        body: updateUserSchema
    })
    .delete('/:id', ({ params, controller }) => controller.deleteUser(params.id))

    