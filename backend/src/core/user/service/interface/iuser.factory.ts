import { UserRole, UserServiceType } from "../../../../types/user";

export interface IUserServiceFactory {
    createService: (role: UserRole) => UserServiceType 
}