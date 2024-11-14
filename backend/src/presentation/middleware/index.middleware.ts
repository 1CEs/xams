import Elysia from "elysia";
import { cors } from '@elysiajs/cors'
import { errorMiddleware } from "./error.middleware";
import { swagger } from '@elysiajs/swagger'

export const indexMiddleware = new Elysia()
    .use(cors({ origin: 'http://localhost:8080' }))
    .onRequest(({ request }) => {
        console.log(`[METHOD:${request.method}] [URL:${request.url}]`)
        return
    })
    .use(swagger())
    .use(errorMiddleware)