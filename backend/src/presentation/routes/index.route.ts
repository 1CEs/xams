import Elysia from "elysia"
import { AuthRoute } from "./auth.route"

export const indexRouter = new Elysia({ prefix: '/api' })
    .use(AuthRoute)