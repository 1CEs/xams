import { SaveServicePayload, SignUpBody, UserPayloadType, UserQueryType } from "../../../types/user";
import { ObjectId } from "mongoose";
import { IInstructorService } from "../interface/service/instructor";
import { InstructorRepository } from "../repository/instructor-repo";

export class InstructorService implements IInstructorService {
    private repository: InstructorRepository

    constructor(repository: InstructorRepository) {
      this.repository = repository
    }
    async saveService(payload: SaveServicePayload): Promise<UserQueryType> {
        return this.repository.save(payload)
    }

    async findService() {
        return this.repository.find()
    }

    async findByIdService(_id: ObjectId){
        return this.repository.findById(_id)
    }

    async findByIdentifierService(identifier: string){
        return this.repository.findByIdentifier(identifier);
    }

    async updateService(payload: UserPayloadType) {
        return this.repository.update(payload)
    }

    async updateBankService(instructor_id: string, exam_id: string) {
        return this.repository.updateBank(instructor_id, exam_id)
    }

    async updateCategoryService(instructor_id: string, name: string, color: string) {
        return this.repository.updateCategory(instructor_id, name, color)
    }

    async deleteService(_id: ObjectId) {
        return this.repository.delete(_id)
    }
}
