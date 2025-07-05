import { BankModel } from "../model/bank.model";
import { IBank } from "../model/interface/ibank";
import { ISubBank } from "../model/interface/isub-bank";

export class BankRepository {
    async createBank(bank: Partial<IBank>): Promise<IBank> {
        return await BankModel.create(bank);
    }

    async getBankById(id: string): Promise<IBank | null> {
        return await BankModel.findById(id).exec();
    }

    async getBanksByExamId(examId: string): Promise<IBank[]> {
        return await BankModel.find({ exam_ids: examId }).exec();
    }

    async updateBank(id: string, bank: Partial<IBank>): Promise<IBank | null> {
        return await BankModel.findByIdAndUpdate(id, bank, { new: true }).exec();
    }

    async deleteBank(id: string): Promise<IBank | null> {
        return await BankModel.findByIdAndDelete(id).exec();
    }

    async addSubBank(bankId: string, subBank: Partial<ISubBank>): Promise<IBank | null> {
        return await BankModel.findByIdAndUpdate(
            bankId,
            { $push: { sub_banks: subBank } },
            { new: true }
        ).exec();
    }

    async findSubBank(bankId: string, subBankPath: string[]): Promise<ISubBank | null> {
        // This is a helper method to find a sub-bank at any nesting level
        // The subBankPath is an array of sub-bank IDs representing the path to the target sub-bank
        const bank = await BankModel.findById(bankId).exec();
        if (!bank) return null;

        let currentLevel = bank.sub_banks || [];
        let targetSubBank: ISubBank | null = null;

        for (const subBankId of subBankPath) {
            if (!currentLevel) return null;
            
            targetSubBank = currentLevel.find(sb => sb._id.toString() === subBankId) || null;
            if (!targetSubBank) return null;
            
            currentLevel = targetSubBank.sub_banks || [];
        }

        return targetSubBank;
    }
    
    async getSubBankHierarchy(bankId: string): Promise<IBank | null> {
        return await BankModel.findById(bankId).exec();
    }
    
    async getBanksByExamIdInSubBanks(examId: string): Promise<IBank[]> {
        // Find banks that have the exam ID in any of their sub-banks (recursively)
        return await BankModel.find({
            $or: [
                { exam_ids: examId },
                { 'sub_banks.exam_ids': examId }
            ]
        }).exec();
    }
}
