import { IUser } from "../../core/user/model/interface/iuser";
import { IUserServiceFactory } from "../../core/user/service/interface/iuser.factory";
import { UserServiceFactory } from "../../core/user/service/user.factory";
import { SignInPayload, SignUpPayload } from "../../types/user";
import { emailRegex } from "../../utils/regex";
import { IAuthController } from "./interface/iauth.controller";
import { SetTokenParameters } from "../../types/auth";

export class AuthController implements IAuthController {
    private _factory: IUserServiceFactory
    constructor() {
        this._factory = new UserServiceFactory()
    }

    async signup(payload: SignUpPayload) {
        console.log(payload)
        const instance = this._factory.createService(payload.body!.role)
        const user = await instance.register(payload.body!)

        delete payload.body
        await this.setToken(String(user?._id), { ...payload })

        return user
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

        return user
    } 

    me(user: IUser) {
        return user
    }

    logout({ accessToken, refreshToken }: Omit<SetTokenParameters, 'jwt'>) {
        accessToken.remove()
        refreshToken.remove()
        return 'Logout Successfully'
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
            path: '/'
        })

        const refToken = await jwt.sign({
            sub: id,
            exp: Number(process.env.REFRESH_TOKEN_EXP! || 604800)
        })
        refreshToken.set({
            value: refToken,
            httpOnly: true,
            maxAge: Number(process.env.REFRESH_TOKEN_EXP! || 604800),
            path: '/'
        })
    }

}