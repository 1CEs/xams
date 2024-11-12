import { IInstructor } from "../../../core/user/model/interface/iintructor"
import { IStudent } from "../../../core/user/model/interface/istudent"
import { IUser } from "../../../core/user/model/interface/iuser"
import { SignUpPayload, SignInPayload } from "../../../types/user"
import { SetTokenParameters } from "../../../types/auth"


export interface IAuthController {
    signup: (payload: SignUpPayload) => Promise<ControllerResponse<any>>
    signin: (payload: SignInPayload) => Promise<ControllerResponse<IUser>>
    me: (user: (IUser | IStudent | IInstructor)) => ControllerResponse<IUser>
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
}