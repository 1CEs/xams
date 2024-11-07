import { ElysiaCustomStatusResponse } from "elysia/dist/error";
import { IUser } from "../../core/user/model/interface/iuser";
import { IUserServiceFactory } from "../../core/user/service/interface/iuser.factory";
import { UserServiceFactory } from "../../core/user/service/user.factory";
import { SignInPayload, SignUpPayload, UserServiceType } from "../../types/user";
import { emailRegex } from "../../utils/regex";
import { IAuthController } from "./interface/iauth.controller";

export class AuthController implements IAuthController {
    private _factory: IUserServiceFactory
    constructor() {
        this._factory = new UserServiceFactory()
    }

    async signup(payload: SignUpPayload) {
        console.log(payload)
        const instance = this._factory.createService(payload.role)
        const user = await instance.register(payload)
        return user
    }

    async signin(payload: SignInPayload) {
        const instance = this._factory.createService('general')
        const isEmail = RegExp(emailRegex).test(payload.identifier)

        let user: IUser | null
        if (isEmail) {
            user = await instance.getUserByEmail(payload.identifier)
        } else {
            user = await instance.getUserByUsername(payload.identifier)
        }

        if (!user) throw new Error('User not found')

        const passwordIsValid = await Bun.password.verify(payload.password, user.password)

        if (!passwordIsValid) throw new Error('Password is invalid')

        return user

    }
}