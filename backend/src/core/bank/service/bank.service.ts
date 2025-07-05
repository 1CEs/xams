import { BankRepository } from "../repository/bank.repository";
import { IBank } from "../model/interface/ibank";
import { ISubBank } from "../model/interface/isub-bank";

export class BankService {
    private bankRepository: BankRepository;

    constructor() {
        this.bankRepository = new BankRepository();
    }

    async createBank(bankName: string, examId: string): Promise<IBank> {
        return await this.bankRepository.createBank({
            bank_name: bankName,
            exam_id: examId,
            sub_banks: []
        });
    }

    async getBankById(id: string): Promise<IBank | null> {
        return await this.bankRepository.getBankById(id);
    }

    async getBanksByExamId(examId: string): Promise<IBank[]> {
        return await this.bankRepository.getBanksByExamId(examId);
    }

    async updateBank(id: string, bankData: Partial<IBank>): Promise<IBank | null> {
        return await this.bankRepository.updateBank(id, bankData);
    }

    async deleteBank(id: string): Promise<IBank | null> {
        return await this.bankRepository.deleteBank(id);
    }

    async createSubBank(bankId: string, name: string, parentId?: string): Promise<IBank | null> {
        const subBank: Partial<ISubBank> = {
            name,
            parent_id: parentId,
            sub_banks: []
        };
        
        return await this.bankRepository.addSubBank(bankId, subBank);
    }

    async findSubBank(bankId: string, subBankPath: string[]): Promise<ISubBank | null> {
        return await this.bankRepository.findSubBank(bankId, subBankPath);
    }

    // Helper method to navigate through the nested structure
    async getSubBankHierarchy(bankId: string): Promise<IBank | null> {
        return await this.bankRepository.getBankById(bankId);
    }
}
