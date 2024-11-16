import jwt from "@elysiajs/jwt";

export const JWT = jwt({
    name: 'jwt',
    secret: process.env.JWT_SECRET!,
    alg: 'HS256'
})