import Elysia from "elysia";
import { cors } from '@elysiajs/cors'
import { errorMiddleware } from "./error.middleware";
import { swagger } from '@elysiajs/swagger'
import { rateLimit } from "./rate-limit.middleware";
import { requestLoggerMiddleware } from "./request-logger.middleware";

export const indexMiddleware = new Elysia()
    .use(cors({
        origin: process.env.FRONTEND_URL || 'http://localhost:8080',
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization']
    }))
    .use(swagger())
    .use(rateLimit({ windowMs: 60 * 1000, maxRequests: 100 })) // 100 requests per minute
    .use(requestLoggerMiddleware)
    .use(errorMiddleware)