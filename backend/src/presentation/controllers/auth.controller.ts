import { IUser } from "../../core/user/model/interface/iuser"
import { IUserServiceFactory } from "../../core/user/service/interface/iuser.factory"
import { UserServiceFactory } from "../../core/user/service/user.factory"
import { SignInPayload, SignUpPayload } from "../../types/user"
import { emailRegex } from "../../utils/regex"
import { IAuthController } from "./interface/iauth.controller"
import { SetTokenParameters } from "../../types/auth"

type JWTInstance = {
    sign: (payload: any) => Promise<string>
    verify: (token: string) => Promise<any>
}

export class AuthController implements IAuthController {
    private _factory: IUserServiceFactory
    constructor() {
        this._factory = new UserServiceFactory()
    }

    private _response<T>(message: string, code: number, data: T ): ControllerResponse<T> {
        return {
            message,
            code,
            data
        }
    }

    async signup(payload: SignUpPayload) {
        console.log(payload)
        const instance = this._factory.createService(payload.body!.role)
        const user = await instance.register(payload.body!)

        delete payload.body
        await this.setToken(String(user?._id), { ...payload })

        return this._response<typeof user>('Sign-up Successfully', 201, user)
    }

    async signin(payload: SignInPayload) {
        const instance = this._factory.createService('general')
        const isEmail = RegExp(emailRegex).test(payload.body!.identifier)

        let user: IUser | null
        if (isEmail) {
            user = await instance.getUserByEmail(payload.body!.identifier)
        } else {
            user = await instance.getUserByUsername(payload.body!.identifier)
        }

        if (!user) throw new Error('User not found')

        const passwordIsValid = await Bun.password.verify(payload.body!.password, user.password)

        if (!passwordIsValid) throw new Error('Password is invalid')
        
        delete payload.body
        await this.setToken(String(user._id), { ...payload })

        return this._response<typeof user>('Sign-in Successfully', 200, user)
    } 

    me(user: IUser) {
        return this._response<typeof user>(`Hello ${user.username}`, 200, user)
    }

    logout({ accessToken, refreshToken }: Omit<SetTokenParameters, 'jwt'>) {
        accessToken.remove()
        refreshToken.remove()
        return this._response<null>('Logout Successfully', 200, null)
    }

    async setToken(id: string, { jwt, accessToken, refreshToken }: SetTokenParameters) {
        const accToken = await jwt.sign({
            sub: id,
            exp: Number(process.env.ACCESS_TOKEN_EXP! || 84600)
        })
        accessToken.set({
            value: accToken,
            httpOnly: true,
            maxAge: Number(process.env.ACCESS_TOKEN_EXP! || 84600),
            path: '/',
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax'
        })

        const refToken = await jwt.sign({
            sub: id,
            exp: Number(process.env.REFRESH_TOKEN_EXP! || 604800)
        })
        refreshToken.set({
            value: refToken,
            httpOnly: true,
            maxAge: Number(process.env.REFRESH_TOKEN_EXP! || 604800),
            path: '/',
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax'
        })
    }

    async forgotPassword(email: string, jwt: JWTInstance) {
        const result = await this._factory.createService('general').forgotPassword(email, jwt)
        return this._response<typeof result>('Password reset email sent successfully', 200, result)
    }

    async resetPassword(token: string, newPassword: string, jwt: JWTInstance) {
        const result = await this._factory.createService('general').resetPassword(token, newPassword, jwt)
        return this._response<typeof result>('Password has been reset successfully', 200, result)
    }
}