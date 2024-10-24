import { ObjectId } from "mongoose";
import { studentModel } from "../../../models/user";
import { UserPayloadType, UserQueryType } from "../../../types/user";
import { IStudentRepository } from "../interface/repository/student";

export class StudentRepository implements IStudentRepository {
    private model: typeof studentModel
    
    constructor() {
        this.model = studentModel
    }

    async save(payload: UserPayloadType) {
        return await new this.model(payload).save()
    }

    async find(): Promise<(Document & UserQueryType & { _id: ObjectId })[]> {
        return await this.model.find()
    }

    async findById(_id: ObjectId): Promise<(Document & UserQueryType & { _id: ObjectId })[] | null> {
        return await this.model.findById(_id)
    }

    async findByIdentifier(identifier: string): Promise<(Document & UserQueryType & { _id: ObjectId })[]> {
        return await this.model.find({ email: identifier, username: identifier })
    }

    async update(payload: UserPayloadType): Promise<(Document & UserQueryType & { _id: ObjectId })[] | null> {
        return await this.model.findByIdAndUpdate(payload._id, payload)
    }

    async delete(_id: ObjectId): Promise<(Document & UserQueryType & { _id: ObjectId })[] | null> {
        return await this.model.findByIdAndDelete(_id)
    }
}