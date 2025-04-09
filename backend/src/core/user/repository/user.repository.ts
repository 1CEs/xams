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

    async findByUsername(username: string, projection?: any) {
        return await this._model.findOne({ username }, projection).exec()
    }

    async findByEmail(email: string, projection?: any) {
        return await this._model.findOne({ email }, projection).exec()
    }
}