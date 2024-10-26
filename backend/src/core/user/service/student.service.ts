import { UserPayloadType, UserQueryType, SignUpBody, SaveServicePayload } from "../../../types/user";
import { StudentRepository } from "../repository/student-repo";
import { IStudentService } from "../interface/service/student";
import { ObjectId } from "mongoose";

export class StudentService implements IStudentService {
    private repository: StudentRepository;

    constructor(repository: StudentRepository) {
        this.repository = repository;
    }

    async saveService(payload: SaveServicePayload): Promise<UserQueryType> {
        return this.repository.save(payload);
    }

    async findService() {
        return this.repository.find();
    }

    async findByIdService(_id: ObjectId) {
        return this.repository.findById(_id);
    }

    async findByIdentifierService(identifier: string) {
        return this.repository.findByIdentifier(identifier);
    }

    async updateService(payload: UserPayloadType) {
        return this.repository.update(payload);
    }

    async deleteService(_id: ObjectId) {
        return this.repository.delete(_id);
    }
}
