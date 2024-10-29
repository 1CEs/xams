import { ObjectId } from "mongoose";
import { IExamination } from "../../models/interface/examination/exam";
import { ExamRepository } from "./exam-repo";
import { IExamService } from "./interface/service/exam";

export class ExamService implements IExamService {
    private repository: ExamRepository

    constructor() {
        this.repository = new ExamRepository();
    }

    async saveService(payload: ExamPayload): Promise<IExamination> {
        return this.repository.save(payload);
    }

    async findService() {
        return this.repository.find();
    }

    async findByIdService(_id: ObjectId) {
        return this.repository.findById(_id);
    }

    async updateService(payload: IExamination) {
        return this.repository.update(payload);
    }

    async deleteService(_id: ObjectId) {
        return this.repository.delete(_id);
    }
}