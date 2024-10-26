import { ObjectId } from "mongoose";
import { PartialPayload, UserPayloadType, UserRepoType, UserType } from "../../../../types/user";

export interface IUserRepoFactory {
    createRepository: (type: UserType) => UserRepoType
}

type UserQueryType = UserPayloadType
export interface IUserRepository {
    save: (payload: PartialPayload) => Promise<UserQueryType>
    find: () => Promise<(Document & UserQueryType & { _id: ObjectId })[]>
    findById: (_id: ObjectId) => Promise<(Document & UserQueryType & { _id: ObjectId })[] | null>
    findByIdentifier: (identifier: string) => Promise<(Document & UserQueryType & { _id: ObjectId }) | null>
    update: (payload: UserPayloadType) => Promise<(Document & UserQueryType & { _id: ObjectId })[] | null>
    delete: (_id: ObjectId) => Promise<(Document & UserQueryType & { _id: ObjectId })[] | null>
}