import Elysia from "elysia";
import { cors } from '@elysiajs/cors'
import { errorMiddleware } from "./error.middleware";

export const indexMiddleware = new Elysia()
    .use(cors({ origin: 'http://localhost:8080' }))
    .use(errorMiddleware)