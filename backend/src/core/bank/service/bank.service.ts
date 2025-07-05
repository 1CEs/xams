import { BankRepository } from "../repository/bank.repository";
import { IBank } from "../model/interface/ibank";
import { ISubBank } from "../model/interface/isub-bank";
import mongoose from "mongoose";

export class BankService {
    private bankRepository: BankRepository;

    constructor() {
        this.bankRepository = new BankRepository();
    }

    async createBank(bankName: string, examIds?: string[]): Promise<IBank> {
        return await this.bankRepository.createBank({
            bank_name: bankName,
            exam_ids: examIds || [],
            sub_banks: []
        });
    }

    async getBankById(id: string): Promise<IBank | null> {
        return await this.bankRepository.getBankById(id);
    }

    async getBanksByExamId(examId: string): Promise<IBank[]> {
        return await this.bankRepository.getBanksByExamId(examId);
    }
    
    async addExamToBank(bankId: string, examId: string): Promise<IBank | null> {
        const bank = await this.bankRepository.getBankById(bankId);
        if (!bank) return null;
        
        if (!bank.exam_ids) bank.exam_ids = [];
        if (!bank.exam_ids.includes(examId)) {
            bank.exam_ids.push(examId);
        }
        
        return await this.bankRepository.updateBank(bankId, { exam_ids: bank.exam_ids });
    }
    
    async removeExamFromBank(bankId: string, examId: string): Promise<IBank | null> {
        const bank = await this.bankRepository.getBankById(bankId);
        if (!bank || !bank.exam_ids) return null;
        
        bank.exam_ids = bank.exam_ids.filter(id => id !== examId);
        return await this.bankRepository.updateBank(bankId, { exam_ids: bank.exam_ids });
    }

    async updateBank(id: string, bankData: Partial<IBank>): Promise<IBank | null> {
        return await this.bankRepository.updateBank(id, bankData);
    }

    async deleteBank(id: string): Promise<IBank | null> {
        return await this.bankRepository.deleteBank(id);
    }

    async createSubBank(bankId: string, name: string, examIds?: string[], parentId?: string): Promise<IBank | null> {
        const subBank: Partial<ISubBank> = {
            name,
            exam_ids: examIds || [],
            parent_id: parentId,
            sub_banks: []
        };
        
        return await this.bankRepository.addSubBank(bankId, subBank);
    }
    
    async addExamToSubBank(bankId: string, subBankPath: string[], examId: string): Promise<IBank | null> {
        const bank = await this.bankRepository.getBankById(bankId);
        if (!bank) return null;
        
        // Find the target sub-bank using the path
        let currentBank = bank;
        let targetSubBank: ISubBank | undefined;
        let parentSubBanks = currentBank.sub_banks || [];
        let lastParentSubBanks: ISubBank[] = parentSubBanks;
        let lastIndex = -1;
        
        for (let i = 0; i < subBankPath.length; i++) {
            const subBankId = subBankPath[i];
            if (!parentSubBanks) break;
            
            const subBankIndex = parentSubBanks.findIndex(sb => sb._id.toString() === subBankId);
            if (subBankIndex === -1) break;
            
            targetSubBank = parentSubBanks[subBankIndex];
            lastParentSubBanks = parentSubBanks;
            lastIndex = subBankIndex;
            parentSubBanks = targetSubBank.sub_banks || [];
        }
        
        if (!targetSubBank || lastIndex === -1) return null;
        
        // Add the exam ID to the sub-bank
        if (!targetSubBank.exam_ids) targetSubBank.exam_ids = [];
        if (!targetSubBank.exam_ids.includes(examId)) {
            targetSubBank.exam_ids.push(examId);
        }
        
        // Update the sub-bank in the hierarchy
        lastParentSubBanks[lastIndex] = targetSubBank;
        
        // Update the bank with the modified sub-bank structure
        return await this.bankRepository.updateBank(bankId, { sub_banks: bank.sub_banks });
    }
    
    async removeExamFromSubBank(bankId: string, subBankPath: string[], examId: string): Promise<IBank | null> {
        const bank = await this.bankRepository.getBankById(bankId);
        if (!bank) return null;
        
        // Find the target sub-bank using the path
        let currentBank = bank;
        let targetSubBank: ISubBank | undefined;
        let parentSubBanks = currentBank.sub_banks || [];
        let lastParentSubBanks: ISubBank[] = parentSubBanks;
        let lastIndex = -1;
        
        for (let i = 0; i < subBankPath.length; i++) {
            const subBankId = subBankPath[i];
            if (!parentSubBanks) break;
            
            const subBankIndex = parentSubBanks.findIndex(sb => sb._id.toString() === subBankId);
            if (subBankIndex === -1) break;
            
            targetSubBank = parentSubBanks[subBankIndex];
            lastParentSubBanks = parentSubBanks;
            lastIndex = subBankIndex;
            parentSubBanks = targetSubBank.sub_banks || [];
        }
        
        if (!targetSubBank || lastIndex === -1 || !targetSubBank.exam_ids) return null;
        
        // Remove the exam ID from the sub-bank
        targetSubBank.exam_ids = targetSubBank.exam_ids.filter(id => id !== examId);
        
        // Update the sub-bank in the hierarchy
        lastParentSubBanks[lastIndex] = targetSubBank;
        
        // Update the bank with the modified sub-bank structure
        return await this.bankRepository.updateBank(bankId, { sub_banks: bank.sub_banks });
    }

    async findSubBank(bankId: string, subBankPath: string[]): Promise<ISubBank | null> {
        return await this.bankRepository.findSubBank(bankId, subBankPath);
    }

    // Helper method to navigate through the nested structure
    async getSubBankHierarchy(bankId: string): Promise<IBank | null> {
        return await this.bankRepository.getBankById(bankId);
    }
    
    async updateSubBank(bankId: string, subBankPath: string[], subBankId: string, updateData: Partial<ISubBank>): Promise<IBank | null> {
        const bank = await this.bankRepository.getBankById(bankId);
        if (!bank) return null;
        
        // Find the target sub-bank using the path
        let targetSubBank: ISubBank | undefined;
        let parentSubBanks = bank.sub_banks || [];
        let lastParentSubBanks: ISubBank[] = parentSubBanks;
        let lastIndex = -1;
        
        // If subBankPath is empty, we're updating a direct child of the bank
        if (subBankPath.length === 0) {
            const subBankIndex = parentSubBanks.findIndex(sb => sb._id.toString() === subBankId);
            if (subBankIndex === -1) return null;
            
            targetSubBank = parentSubBanks[subBankIndex];
            lastIndex = subBankIndex;
        } else {
            // Navigate through the path to find the parent of the target sub-bank
            for (let i = 0; i < subBankPath.length; i++) {
                const pathId = subBankPath[i];
                if (!parentSubBanks) break;
                
                const subBankIndex = parentSubBanks.findIndex(sb => sb._id.toString() === pathId);
                if (subBankIndex === -1) break;
                
                const currentSubBank = parentSubBanks[subBankIndex];
                
                if (i === subBankPath.length - 1) {
                    // We've reached the parent of our target
                    lastParentSubBanks = currentSubBank.sub_banks || [];
                    const targetIndex = lastParentSubBanks.findIndex(sb => sb._id.toString() === subBankId);
                    if (targetIndex === -1) return null;
                    
                    targetSubBank = lastParentSubBanks[targetIndex];
                    lastIndex = targetIndex;
                    // Update the reference to the parent's sub_banks array
                    parentSubBanks[subBankIndex].sub_banks = lastParentSubBanks;
                } else {
                    // Continue traversing the path
                    parentSubBanks = currentSubBank.sub_banks || [];
                }
            }
        }
        
        if (!targetSubBank || lastIndex === -1) return null;
        
        // Update the sub-bank with the provided data
        const updatedSubBank = { ...targetSubBank, ...updateData };
        
        // Update the sub-bank in its parent's array
        lastParentSubBanks[lastIndex] = updatedSubBank;
        
        // If we were updating a direct child of the bank
        if (subBankPath.length === 0) {
            return await this.bankRepository.updateBank(bankId, { sub_banks: lastParentSubBanks });
        }
        
        // Otherwise, update the entire bank with the modified sub-bank structure
        return await this.bankRepository.updateBank(bankId, { sub_banks: bank.sub_banks });
    }
}
