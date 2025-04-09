import Elysia from "elysia";
import { cors } from '@elysiajs/cors'
import { errorMiddleware } from "./error.middleware";
import { swagger } from '@elysiajs/swagger'
import { rateLimit } from "./rate-limit.middleware";
import { requestLoggerMiddleware } from "./request-logger.middleware";

export const indexMiddleware = new Elysia()
    .use(cors())
    .use(swagger())
    .use(rateLimit({ windowMs: 60 * 1000, maxRequests: 100 })) // 100 requests per minute
    .use(requestLoggerMiddleware)
    .use(errorMiddleware)