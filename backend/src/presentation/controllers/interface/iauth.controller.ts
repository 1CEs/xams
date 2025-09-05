import { IInstructor } from "../../../core/user/model/interface/iintructor"
import { IStudent } from "../../../core/user/model/interface/istudent"
import { IUser } from "../../../core/user/model/interface/iuser"
import { SignUpPayload, SignInPayload } from "../../../types/user"
import { SetTokenParameters } from "../../../types/auth"

type JWTInstance = {
    sign: (payload: any) => Promise<string>
    verify: (token: string) => Promise<any>
}

export interface IAuthController {
    signup: (payload: SignUpPayload) => Promise<ControllerResponse<any>>
    signin: (payload: SignInPayload) => Promise<ControllerResponse<IUser | null>>
    me: (user: (IUser | IStudent | IInstructor)) => ControllerResponse<IUser | null>
    logout: (
        {
            jwt,
            accessToken,
            refreshToken
        }: SetTokenParameters
    ) => ControllerResponse<null>
    setToken: (
        id: string,
        {
            jwt,
            accessToken,
            refreshToken
        }: SetTokenParameters
    ) => Promise<void>
    forgotPassword: (email: string, jwt: JWTInstance) => Promise<any>
    resetPassword: (token: string, newPassword: string, jwt: JWTInstance) => Promise<any>
}