import Elysia from "elysia";
import { cors } from '@elysiajs/cors'
import { errorMiddleware } from "./error.middleware";
import { swagger } from '@elysiajs/swagger'

export const indexMiddleware = new Elysia()
    .use(cors())
    .use(swagger())
    .use(errorMiddleware)