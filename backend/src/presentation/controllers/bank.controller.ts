import { BankService } from "../../core/bank/service/bank.service";
import { IBank } from "../../core/bank/model/interface/ibank";
import { IBankController } from "./interface/ibank.controller";
import { InstructorService } from "../../core/user/service/instructor.service";

export class BankController implements IBankController {
    private _service: BankService;
    private _instructorService: InstructorService;

    constructor() {
        this._service = new BankService();
        this._instructorService = new InstructorService('instructor');
    }

    private _response<T>(message: string, code: number, data: T) {
        return {
            message,
            code,
            data
        };
    }

    // Bank methods
    async createBank(bankName: string, examIds?: string | string[], instructorId?: string) {
        // Convert single examId to array if provided
        const examIdsArray = examIds ? (Array.isArray(examIds) ? examIds : [examIds]) : undefined;
        const bank = await this._service.createBank(bankName, examIdsArray);
        
        // If instructorId is provided, add the bank to the instructor's bank array
        if (instructorId && bank) {
            await this._instructorService.updateBank(instructorId, bank._id.toString());
        }
        
        return this._response<typeof bank>('Bank created successfully', 201, bank);
    }

    async getBankById(id: string) {
        const bank = await this._service.getBankById(id);
        return this._response<typeof bank>('Bank retrieved successfully', 200, bank);
    }

    async getBanksByExamId(examId: string) {
        const banks = await this._service.getBanksByExamId(examId);
        return this._response<typeof banks>('Banks retrieved successfully', 200, banks);
    }

    async updateBank(id: string, payload: Partial<IBank>) {
        const bank = await this._service.updateBank(id, payload);
        return this._response<typeof bank>('Bank updated successfully', 200, bank);
    }

    async deleteBank(id: string) {
        const bank = await this._service.deleteBank(id);
        return this._response<typeof bank>('Bank deleted successfully', 200, bank);
    }

    // SubBank methods
    async createSubBank(bankId: string, name: string, examIds?: string | string[], parentId?: string) {
        // Convert single examId to array if provided
        const examIdsArray = examIds ? (Array.isArray(examIds) ? examIds : [examIds]) : undefined;
        const bank = await this._service.createSubBank(bankId, name, examIdsArray, parentId);
        return this._response<typeof bank>('SubBank created successfully', 201, bank);
    }

    async getSubBankHierarchy(bankId: string) {
        const hierarchy = await this._service.getSubBankHierarchy(bankId);
        return this._response<typeof hierarchy>('SubBank hierarchy retrieved successfully', 200, hierarchy);
    }
    
    // Exam management in banks
    async addExamToBank(bankId: string, examId: string) {
        const bank = await this._service.addExamToBank(bankId, examId);
        return this._response<typeof bank>('Exam added to bank successfully', 200, bank);
    }
    
    async removeExamFromBank(bankId: string, examId: string) {
        const bank = await this._service.removeExamFromBank(bankId, examId);
        return this._response<typeof bank>('Exam removed from bank successfully', 200, bank);
    }
    
    // Exam management in sub-banks
    async addExamToSubBank(bankId: string, subBankPath: string[], examId: string) {
        const bank = await this._service.addExamToSubBank(bankId, subBankPath, examId);
        return this._response<typeof bank>('Exam added to sub-bank successfully', 200, bank);
    }
    
    async removeExamFromSubBank(bankId: string, subBankPath: string[], examId: string) {
        const bank = await this._service.removeExamFromSubBank(bankId, subBankPath, examId);
        return this._response<typeof bank>('Exam removed from sub-bank successfully', 200, bank);
    }
    
    // Update a sub-bank
    async updateSubBank(bankId: string, subBankPath: string[], subBankId: string, updateData: any) {
        const bank = await this._service.updateSubBank(bankId, subBankPath, subBankId, updateData);
        return this._response<typeof bank>('Sub-bank updated successfully', 200, bank);
    }
}
