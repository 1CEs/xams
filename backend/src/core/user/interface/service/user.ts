import { ObjectId } from "mongoose"
import { UserPayloadType, UserQueryType, UserServiceType, UserType } from "../../../../types/user"

export interface IUserServiceFactory {
    createService: (type: UserType) => UserServiceType
}

export interface IUserService {
    saveService: (payload: UserPayloadType) => Promise<UserQueryType>
    findService: () => Promise<(Document & UserQueryType & { _id: ObjectId })[]>
    findByIdService: (_id: ObjectId) => Promise<(Document & UserQueryType & { _id: ObjectId })[] | null>
    findByIdentifierService: (identifier: 'username' | 'email') => Promise<(Document & UserQueryType & { _id: ObjectId })[]>
    updateService: (payload: UserPayloadType) => Promise<(Document & UserQueryType & { _id: ObjectId })[] | null>
    deleteService: (_id: ObjectId) => Promise<(Document & UserQueryType & { _id: ObjectId })[] | null>
}