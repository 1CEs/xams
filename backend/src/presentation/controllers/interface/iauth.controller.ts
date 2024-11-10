import { IInstructor } from "../../../core/user/model/interface/iintructor"
import { IStudent } from "../../../core/user/model/interface/istudent"
import { IUser } from "../../../core/user/model/interface/iuser"
import { SignUpPayload, SignInPayload } from "../../../types/user"
import { Document } from "mongoose"
import { SetTokenParameters } from "../../../types/auth"


export interface IAuthController {
    signup: (payload: SignUpPayload) => Promise<((IUser | IStudent | IInstructor) & Document) | null>
    signin: (payload: SignInPayload) => Promise<IUser>
    me: (user: (IUser | IStudent | IInstructor)) => IUser
    setToken: (
        id: string,
        {
            jwt,
            accessToken,
            refreshToken
        }: SetTokenParameters
    ) => Promise<void>
}