import { ObjectId } from "mongoose";
import { instructorModel } from "../../../models/user";
import { PartialPayload, UserPayloadType, UserQueryType } from "../../../types/user";
import { IInstructorRepository } from "../interface/repository/instructor";
import { IInstructor } from "../../../models/interface/user/instructor";

export class InstructorRepository implements IInstructorRepository {
    private model: typeof instructorModel

    constructor() {
        this.model = instructorModel
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

    async updateBank(instructor_id: string, exam_id:string): Promise<(Document & IInstructor & { _id: ObjectId })[] | null> {
        return await this.model.findByIdAndUpdate(instructor_id, { $push: { exam_bank: exam_id }})
    }

    async delete(_id: ObjectId): Promise<(Document & UserQueryType & { _id: ObjectId })[] | null> {
        return await this.model.findByIdAndDelete(_id)
    }
}