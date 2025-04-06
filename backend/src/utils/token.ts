import { JWT } from "../presentation/middleware/jwt.middleware"

interface TokenPayload {
    id: string
    email: string
}

type JWTInstance = {
    sign: (payload: any) => Promise<string>
    verify: (token: string) => Promise<any>
}

export const generateToken = async (jwt: JWTInstance, payload: TokenPayload, expiresIn: string): Promise<string> => {
    return await jwt.sign({
        sub: payload.id,
        email: payload.email,
        exp: expiresIn === '1h' ? 3600 : 86400
    })
}

export const verifyToken = async (jwt: JWTInstance, token: string): Promise<TokenPayload> => {
    const decoded = await jwt.verify(token)
    return {
        id: decoded.sub,
        email: decoded.email
    }
} 