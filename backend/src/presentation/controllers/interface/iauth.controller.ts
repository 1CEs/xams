
import { IInstructor } from "../../../core/user/model/interface/iintructor"
import { IStudent } from "../../../core/user/model/interface/istudent"
import { IUser } from "../../../core/user/model/interface/iuser"
import { SignUpPayload, SignInPayload } from "../../../types/user"
import { Document } from "mongoose"


export interface IAuthController {
    signup: (payload: SignUpPayload) => Promise<((IUser | IStudent | IInstructor) & Document) | null>
    signin: (payload: SignInPayload) => Promise<any>
}