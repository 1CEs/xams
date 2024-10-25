import { SignUpBody, UserPayloadType, UserQueryType } from "../../../types/user";
import { ObjectId } from "mongoose";
import { IUserService } from "../interface/service/user";
import { AdminRepository } from "../repository/admin-repo";

export class AdminService implements IUserService {
    private repository: AdminRepository

    constructor(repository: AdminRepository) {
        this.repository = repository
    }

    async saveService(payload: SignUpBody): Promise<UserQueryType> {
        return this.repository.save(payload)
    }

    async findService() {
        return this.repository.find()
    }

    async findByIdService(_id: ObjectId) {
        return this.repository.findById(_id)
    }

    async findByIdentifierService(identifier: 'username' | 'email', value: string) {
        return this.repository.findByIdentifier(identifier, value)
    }

    async updateService(payload: UserPayloadType) {
        return this.repository.update(payload)
    }

    async deleteService(_id: ObjectId) {
        return this.repository.delete(_id)
    }
}