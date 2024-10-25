import { UserPayloadType, UserQueryType, SignUpBody } from "../../../types/user";
import { StudentRepository } from "../repository/student-repo";
import { IStudentService } from "../interface/service/student";
import { ObjectId } from "mongoose";

export class StudentService implements IStudentService {
    private repository: StudentRepository;

    constructor(repository: StudentRepository) {
        this.repository = repository;
    }

    async saveService(payload: SignUpBody): Promise<UserQueryType> {
        const usernameAlreadyExists = await this.findByIdentifierService('username', payload.username)
        const emailAlreadyExists = await this.findByIdentifierService('email', payload.email)
        console.log(usernameAlreadyExists)
        console.log(emailAlreadyExists)
        if(usernameAlreadyExists.length != 0 || emailAlreadyExists.length != 0) {
            throw new Error('Username or email already exists.')
        }
        return this.repository.save(payload);
    }

    async findService() {
        return this.repository.find();
    }

    async findByIdService(_id: ObjectId) {
        return this.repository.findById(_id);
    }

    async findByIdentifierService(identifier: 'username' | 'email', value: string) {
        return this.repository.findByIdentifier(identifier, value);
    }

    async updateService(payload: UserPayloadType) {
        return this.repository.update(payload);
    }

    async deleteService(_id: ObjectId) {
        return this.repository.delete(_id);
    }
}
