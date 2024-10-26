
import { Cookie } from "elysia"

interface JwtService {
    sign: (payload: Record<string, any>) => Promise<string>
}

export async function assignTokensToCookies<T extends JwtService>(
    username: string,
    jwt: T,
    accessToken: Cookie<string | undefined>,
    refreshToken: Cookie<string | undefined>
) {
    // Generate and set the access token
    const accToken = await jwt.sign({
        sub: username,
        exp: Number(process.env.ACCESS_TOKEN_EXP)
    })
    accessToken.set({
        value: accToken,
        httpOnly: true,
        maxAge: 6000,
        path: "/",
    })

    // Generate and set the refresh token
    const refToken = await jwt.sign({
        sub: username,
        exp: Number(process.env.REFRESH_TOKEN_EXP)
    })
    refreshToken.set({
        value: refToken,
        httpOnly: true,
        maxAge: 86400,
        path: "/",
    })

    return { accToken, refToken };
}
