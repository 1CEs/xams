import Elysia from "elysia";
import { cors } from '@elysiajs/cors'
import { errorMiddleware } from "./error.middleware";
import { swagger } from '@elysiajs/swagger'
import { rateLimit } from "./rate-limit.middleware";

export const indexMiddleware = new Elysia()
    .use(cors({
        origin: [
            "http://localhost:8081", // Frontend development server
            "http://localhost:8080", // Frontend development server
            "http://localhost:3000", // Backend server (for same-origin requests)
            "https://xams.online",    // Production frontend (if exists)
            "https://www.xams.online" // Production frontend with www
        ],
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization']
    }))
    .use(swagger())
    .use(rateLimit({ windowMs: 60 * 1000, maxRequests: 100 }))
    .use(errorMiddleware)