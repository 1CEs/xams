import Elysia from "elysia"
import { AuthRoute } from "./auth.route"
import { UserRoute } from "./user.route"

export const indexRouter = new Elysia({ prefix: '/api' })
    .use(AuthRoute)
    .use(UserRoute)