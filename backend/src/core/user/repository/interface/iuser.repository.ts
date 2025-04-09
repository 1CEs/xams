import { IBaseRepository } from "../../../base/interface/ibase.repository"
import { IUserDocument } from "../../../../types/user"

export interface IUserRepository extends IBaseRepository<IUserDocument> {
    findByUsername(username: string, projection?: any): Promise<IUserDocument | null>
    findByEmail(email: string, projection?: any): Promise<IUserDocument | null>
}