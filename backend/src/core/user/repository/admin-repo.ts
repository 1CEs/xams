import { ObjectId } from "mongoose";
import { adminModel } from "../../../models/user";
import { PartialPayload, UserPayloadType, UserQueryType } from "../../../types/user";
import { IAdminRepository } from "../interface/repository/admin";

export class AdminRepository implements IAdminRepository {
    private model: typeof adminModel
    
    constructor() {
        this.model = adminModel
    }

    async save(payload: PartialPayload) {
        return await new this.model(payload).save()
    }

    async find(): Promise<(Document & UserQueryType & { _id: ObjectId })[]> {
        return await this.model.find()
    }

    async findById(_id: ObjectId): Promise<(Document & UserQueryType & { _id: ObjectId })[] | null> {
        return await this.model.findById(_id)
    }

    async findByIdentifier(identifier: string): Promise<(Document & UserQueryType & { _id: ObjectId }) | null> {
        return await this.model.findOne({
            $or: [
                { email: { $regex: new RegExp(`^${identifier}$`, 'i') } },
                { username: { $regex: new RegExp(`^${identifier}$`, 'i') } }
            ]
        })
    }

    async update(payload: UserPayloadType): Promise<(Document & UserQueryType & { _id: ObjectId })[] | null> {
        return await this.model.findByIdAndUpdate(payload._id, payload)
    }

    async delete(_id: ObjectId): Promise<(Document & UserQueryType & { _id: ObjectId })[] | null> {
        return await this.model.findByIdAndDelete(_id)
    }
}