import { JWTOption } from "@elysiajs/jwt"

export const jwtOption: JWTOption = {
    name: 'jwt',
    secret: process.env.JWT_SECRET!,
}