import { JWTPayloadSpec } from "@elysiajs/jwt"
import { Cookie } from "elysia"

declare type JWTMethods = {
    readonly sign: (morePayload: Record<string, string | number> & JWTPayloadSpec) => Promise<string>
    readonly verify: (jwt?: string) => Promise<false | (Record<string, string | number> & JWTPayloadSpec)>
}

declare type SetTokenParameters = {
    jwt: JWTMethods,
    accessToken: Cookie<string | undefined>,
    refreshToken: Cookie<string | undefined>
}