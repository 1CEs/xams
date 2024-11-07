import { IBaseRepository } from "../../../base/interface/ibase.repository"
import { IUser } from "../../model/interface/iuser"

export interface IUserRepository extends IBaseRepository<IUser> {
    findByUsername: (username: string) => Promise<(IUser) | null>
    findByEmail: (email: string) => Promise<(IUser) | null>
}