import { BaseRepository } from "../../base/base.repository";
import { IUserRepository } from "./interface/iuser.repository";
import { UserModel } from "../model/user.model";
import { IUserDocument } from "../../../types/user";

export class UserRepository 
        extends BaseRepository<IUserDocument> 
        implements IUserRepository {
            
    constructor() {
        super(UserModel)
    }

    async findByUsername(username: string) {
        return await this._model.findOne().select({ username })
    }

    async findByEmail(email: string) {
        return await this._model.findOne().select({ email }).exec()
    }
}