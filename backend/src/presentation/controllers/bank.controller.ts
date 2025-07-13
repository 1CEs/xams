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

    async getBanksByInstructorId(instructorId: string) {
        // Get the instructor and their associated banks
        const instructor = await this._instructorService.getUserById(instructorId);
        if (!instructor) {
            return this._response<null>('Instructor not found', 404, null);
        }

        // Get the banks directly from the instructor (already populated)
        const banks = await this._instructorService.getBank(instructorId);
        if (!banks || banks.length === 0) {
            return this._response<[]>('No banks found for instructor', 200, []);
        }

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
    
    // Direct sub-bank creation under main bank (no parent sub-bank)
    async createSubBank(bankId: string, name: string, examIds?: string | string[]) {
        // Convert single examId to array if provided
        const examIdsArray = examIds ? (Array.isArray(examIds) ? examIds : [examIds]) : undefined;
        const bank = await this._service.createSubBank(bankId, name, examIdsArray);
        return this._response<typeof bank>('Direct SubBank created successfully', 201, bank);
    }
    
    // Nested sub-bank creation within a specific parent sub-bank (requires parent bank ID + parent sub-bank ID)
    async createNestedSubBankWithParent(parentBankId: string, parentSubBankId: string, name: string, examIds?: string | string[]) {
        // Convert single examId to array if provided
        const examIdsArray = examIds ? (Array.isArray(examIds) ? examIds : [examIds]) : undefined;
        console.log(`Controller: Creating nested sub-bank '${name}' under parent bank: ${parentBankId}, parent sub-bank: ${parentSubBankId}`);
        const bank = await this._service.createSubBankInSubBank(parentBankId, parentSubBankId, name, examIdsArray);
        return this._response<typeof bank>('Nested SubBank created successfully', 201, bank);
    }
    
    async createNestedSubBank(bankId: string, subBankPath: string[], name: string, examIds?: string | string[]) {
        try {
            // Convert single examId to array if provided
            const examIdsArray = examIds ? (Array.isArray(examIds) ? examIds : [examIds]) : undefined;
            const bank = await this._service.createNestedSubBank(bankId, subBankPath, name, examIdsArray);
            return this._response<typeof bank>('Nested SubBank created successfully', 201, bank);
        } catch (error: any) {
            // Handle depth validation errors specifically
            if (error.message && error.message.includes('Maximum depth')) {
                return this._response<null>(error.message, 400, null);
            }
            // Re-throw other errors
            throw error;
        }
    }

    async canCreateSubBank(bankId: string, subBankPath: string[]) {
        try {
            const validation = await this._service.canCreateSubBank(bankId, subBankPath);
            return this._response<typeof validation>('Sub-bank creation validation completed', 200, validation);
        } catch (error: any) {
            return this._response<null>(error.message || 'Sub-bank creation validation failed', 400, null);
        }
    }

    async canCreateSubBankInSubBank(parentBankId: string, subBankId: string) {
        try {
            const validation = await this._service.canCreateSubBankInSubBank(parentBankId, subBankId);
            return this._response<typeof validation>('Sub-bank creation validation completed', 200, validation);
        } catch (error: any) {
            return this._response<null>(error.message || 'Sub-bank creation validation failed', 400, null);
        }
    }

    async createSubBankInSubBank(parentBankId: string, subBankId: string, name: string, examIds?: string | string[]) {
        try {
            const examIdsArray = examIds ? (Array.isArray(examIds) ? examIds : [examIds]) : undefined;
            const bank = await this._service.createSubBankInSubBank(parentBankId, subBankId, name, examIdsArray);
            return this._response<typeof bank>('Sub-bank created successfully in sub-bank', 201, bank);
        } catch (error: any) {
            if (error.message && error.message.includes('Maximum depth')) {
                return this._response<null>(error.message, 400, null);
            }
            return this._response<null>(error.message || 'Sub-bank creation failed', 500, null);
        }
    }

    async getSubBankHierarchy(bankId: string, instructorId?: string) {
        const hierarchy = await this._service.getSubBankHierarchy(bankId, instructorId);
        return this._response<typeof hierarchy>('SubBank hierarchy retrieved successfully', 200, hierarchy);
    }
    
    async getSubBankHierarchyByParentAndId(parentBankId: string, subBankId: string) {
        const result = await this._service.getSubBankHierarchyByParentAndId(parentBankId, subBankId);
        return this._response<typeof result>('SubBank hierarchy with path retrieved successfully', 200, result);
    }
    
    async getMaxSubBankDepth() {
        const maxDepth = this._service.getMaxSubBankDepth();
        return this._response<number>('Maximum sub-bank depth retrieved', 200, maxDepth);
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
    
    // Simple add exam to sub-bank method
    async addExamToSubBankSimple(parentId: string, subBankId: string, examId: string) {
        const bank = await this._service.addExamToSubBankSimple(parentId, subBankId, examId);
        return this._response<typeof bank>('Exam added to sub-bank successfully', 200, bank);
    }
    
    // Update a sub-bank
    async updateSubBank(bankId: string, subBankPath: string[], subBankId: string, updateData: any) {
        const bank = await this._service.updateSubBank(bankId, subBankPath, subBankId, updateData);
        return this._response<typeof bank>('Sub-bank updated successfully', 200, bank);
    }
    
    // Simple rename sub-bank method
    async renameSubBank(parentId: string, subBankId: string, newName: string) {
        const bank = await this._service.renameSubBank(parentId, subBankId, newName);
        return this._response<typeof bank>('Sub-bank renamed successfully', 200, bank);
    }
    
    // Delete a sub-bank
    async deleteSubBank(bankId: string, subBankPath: string[], subBankId: string) {
        const bank = await this._service.deleteSubBank(bankId, subBankPath, subBankId);
        return this._response<typeof bank>('Sub-bank deleted successfully', 200, bank);
    }
}
