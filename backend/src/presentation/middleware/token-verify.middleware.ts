import Elysia from "elysia"
import { JWT } from "./jwt.middleware"
import { UserServiceFactory } from "../../core/user/service/user.factory"

export const tokenVerifier = (app: Elysia) =>
    app
    .use(JWT)
    .derive(async ({ jwt, cookie: { accessToken }, set }) => {
        if (!accessToken.value) {
            set.status = "Unauthorized"
            throw new Error("Access token is missing")
        }
        
        const jwtPayload = await jwt.verify(accessToken.value)
        if (!jwtPayload) {
            set.status = "Forbidden"
            throw new Error("Access token is invalid")
        }

        const userId = jwtPayload.sub
        const instance = new UserServiceFactory().createService('general')
        const user = await instance.getUserById(userId!)

        if (!user) {
            set.status = "Forbidden"
            throw new Error("Access token is invalid")
        }

        return {
            user,
        }
    })