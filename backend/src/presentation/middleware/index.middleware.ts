import Elysia from "elysia";
import { cors } from '@elysiajs/cors'

export const indexMiddleware = new Elysia()
    .use(cors({ origin: 'http://localhost:8080' }))