import { IUser } from "../../core/user/model/interface/iuser"
import { IUserServiceFactory } from "../../core/user/service/interface/iuser.factory"
import { UserServiceFactory } from "../../core/user/service/user.factory"
import { SignInPayload, SignUpPayload } from "../../types/user"
import { emailRegex } from "../../utils/regex"
import { IAuthController } from "./interface/iauth.controller"
import { SetTokenParameters } from "../../types/auth"
import { IStudent } from "../../core/user/model/interface/istudent"
import { IInstructor } from "../../core/user/model/interface/iintructor"

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
        console.log("in")
        const instance = this._factory.createService(payload.body!.role)
        const user = await instance.register(payload.body!)
        if (!user) throw new Error('User not found')
        delete payload.body
        await this.setToken(String((user as unknown as IUser | IStudent | IInstructor)._id), { ...payload })

        return this._response('Sign-up Successfully', 201, user)
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
        console.log(user)

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
        // For JWT, exp should be in seconds since epoch, not duration in seconds
        const accessTokenExp = Number(process.env.ACCESS_TOKEN_EXP! || 84600); // Default 24 hours in seconds
        const refreshTokenExp = Number(process.env.REFRESH_TOKEN_EXP! || 604800); // Default 7 days in seconds
        
        const currentTimestamp = Math.floor(Date.now() / 1000); // Current time in seconds
        
        const accToken = await jwt.sign({
            sub: id,
            iat: currentTimestamp,
            exp: currentTimestamp + accessTokenExp
        })
        
        accessToken.set({
            value: accToken,
            httpOnly: true,
            maxAge: accessTokenExp,
            path: '/',
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax'
        })

        const refToken = await jwt.sign({
            sub: id,
            iat: currentTimestamp,
            exp: currentTimestamp + refreshTokenExp
        })
        
        refreshToken.set({
            value: refToken,
            httpOnly: true,
            maxAge: refreshTokenExp,
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