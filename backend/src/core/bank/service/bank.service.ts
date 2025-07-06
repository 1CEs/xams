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

        console.log(bank.exam_ids)
        
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
    
    async createNestedSubBank(bankId: string, subBankPath: string[], name: string, examIds?: string[]): Promise<IBank | null> {
        console.log('Creating nested sub-bank with path:', subBankPath, 'name:', name);
        
        const bank = await this.bankRepository.getBankById(bankId);
        if (!bank) {
            console.log('Bank not found with ID:', bankId);
            return null;
        }
        
        // If subBankPath is empty, use the standard createSubBank method
        if (!subBankPath || subBankPath.length === 0) {
            console.log('Empty path, using standard createSubBank');
            return await this.createSubBank(bankId, name, examIds);
        }
        
        // The last ID in the path is the parent where we want to add the new sub-bank
        const parentId = subBankPath[subBankPath.length - 1];
        console.log('Parent ID:', parentId);
        
        // Create the new sub-bank object with a new ObjectId
        const newSubBank: Partial<ISubBank> = {
            _id: new mongoose.Types.ObjectId() as any,
            name,
            exam_ids: examIds || [],
            parent_id: parentId,
            sub_banks: []
        };
        console.log('Created new sub-bank object:', newSubBank);
        
        // Function to recursively find and update a sub-bank
        const findAndAddSubBank = (subBanks: ISubBank[], path: string[], currentIndex: number): boolean => {
            // If we've reached the end of the path, we've found the parent
            if (currentIndex >= path.length) return false;
            
            const currentPathId = path[currentIndex];
            const subBankIndex = subBanks.findIndex(sb => sb._id.toString() === currentPathId);
            
            if (subBankIndex === -1) {
                console.log('Sub-bank not found in path at index', currentIndex);
                return false;
            }
            
            // If this is the last item in the path (the parent)
            if (currentIndex === path.length - 1) {
                // Initialize sub_banks array if it doesn't exist
                if (!subBanks[subBankIndex].sub_banks) {
                    subBanks[subBankIndex].sub_banks = [];
                }
                
                // Add the new sub-bank to the parent's sub_banks array
                subBanks[subBankIndex].sub_banks.push(newSubBank as ISubBank);
                console.log('Added new sub-bank to parent');
                return true;
            }
            
            // Otherwise, continue traversing the path
            if (!subBanks[subBankIndex].sub_banks) {
                subBanks[subBankIndex].sub_banks = []; // Initialize if it doesn't exist
            }
            
            return findAndAddSubBank(subBanks[subBankIndex].sub_banks, path, currentIndex + 1);
        };
        
        // Start the recursive search from the root level
        if (!findAndAddSubBank(bank.sub_banks || [], subBankPath, 0)) {
            console.log('Failed to find parent sub-bank in the hierarchy');
            return null;
        }
        
        // Update the bank with the modified sub-bank structure
        console.log('Updating bank with new sub-bank structure');
        const updatedBank = await this.bankRepository.updateBank(bankId, { sub_banks: bank.sub_banks });
        
        return updatedBank;
    }
    
    async addExamToSubBank(bankId: string, subBankPath: string[], examId: string): Promise<IBank | null> {
        console.log('Service: Adding exam to sub-bank with bankId:', bankId, 'subBankPath:', subBankPath, 'examId:', examId);
        
        const bank = await this.bankRepository.getBankById(bankId);
        if (!bank) {
            console.log('Bank not found with ID:', bankId);
            return null;
        }
        
        // Simple case: Direct sub-bank of the bank (most common case)
        if (subBankPath.length === 1) {
            const subBankId = subBankPath[0];
            console.log('Looking for direct sub-bank with ID:', subBankId);
            
            // Make sure sub_banks is initialized
            if (!bank.sub_banks) {
                console.log('Bank has no sub_banks array, initializing');
                bank.sub_banks = [];
                return null; // No sub-banks to modify
            }
            
            // Find the sub-bank directly in the bank's sub_banks array
            const subBankIndex = bank.sub_banks.findIndex(sb => sb._id.toString() === subBankId);
            
            if (subBankIndex === -1) {
                console.log('Sub-bank not found with ID:', subBankId, 'in bank:', bankId);
                console.log('Available sub-bank IDs:', bank.sub_banks.map(sb => sb._id.toString()));
                return null;
            }
            
            // Get the target sub-bank
            const targetSubBank = bank.sub_banks[subBankIndex];
            console.log('Found direct sub-bank:', targetSubBank.name);
            
            // Initialize exam_ids array if it doesn't exist
            if (!targetSubBank.exam_ids) {
                targetSubBank.exam_ids = [];
            }
            
            // Add the exam ID if it's not already in the array
            if (!targetSubBank.exam_ids.includes(examId)) {
                console.log('Adding exam ID to sub-bank');
                targetSubBank.exam_ids.push(examId);
            } else {
                console.log('Exam ID already exists in sub-bank');
            }
            
            // Update the sub-bank in the bank's sub_banks array
            bank.sub_banks[subBankIndex] = targetSubBank;
            
            // Update the bank with the modified sub-bank
            console.log('Updating bank with modified sub-bank');
            return await this.bankRepository.updateBank(bankId, { sub_banks: bank.sub_banks });
        }
        
        // For nested sub-banks (multi-level path)
        console.log('Processing nested sub-bank path');
        
        // Make sure sub_banks is initialized
        if (!bank.sub_banks) {
            console.log('Bank has no sub_banks array, initializing');
            bank.sub_banks = [];
            return null; // No sub-banks to modify
        }
        
        let currentBank = bank;
        let targetSubBank: ISubBank | undefined;
        let parentSubBanks = bank.sub_banks; // We've checked it's not undefined
        let lastParentSubBanks: ISubBank[] = parentSubBanks;
        let lastIndex = -1;
        
        for (let i = 0; i < subBankPath.length; i++) {
            const subBankId = subBankPath[i];
            if (!parentSubBanks) {
                console.log('No parent sub-banks at path level', i);
                break;
            }
            
            console.log(`Looking for sub-bank at path level ${i}:`, subBankId);
            console.log('Available sub-banks at this level:', parentSubBanks.map(sb => sb._id.toString()));
            
            const subBankIndex = parentSubBanks.findIndex(sb => sb._id.toString() === subBankId);
            if (subBankIndex === -1) {
                console.log('Sub-bank not found at path level', i);
                break;
            }
            
            console.log('Found sub-bank at index:', subBankIndex);
            targetSubBank = parentSubBanks[subBankIndex];
            lastParentSubBanks = parentSubBanks;
            lastIndex = subBankIndex;
            parentSubBanks = targetSubBank.sub_banks || [];
        }
        
        if (!targetSubBank || lastIndex === -1) {
            console.log('Target sub-bank not found in path');
            return null;
        }
        
        console.log('Found target sub-bank:', targetSubBank.name);
        
        // Add the exam ID to the sub-bank
        if (!targetSubBank.exam_ids) targetSubBank.exam_ids = [];
        if (!targetSubBank.exam_ids.includes(examId)) {
            console.log('Adding exam ID to nested sub-bank');
            targetSubBank.exam_ids.push(examId);
        }
        
        // Update the sub-bank in the hierarchy
        lastParentSubBanks[lastIndex] = targetSubBank;
        
        // Update the bank with the modified sub-bank structure
        console.log('Updating bank with nested sub-bank structure');
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

    async deleteSubBank(bankId: string, subBankPath: string[], subBankId: string): Promise<IBank | null> {
        const bank = await this.bankRepository.getBankById(bankId);
        if (!bank) return null;
        
        // Find the parent sub-bank using the path
        let parentSubBanks = bank.sub_banks || [];
        
        // If subBankPath is empty, we're deleting a direct child of the bank
        if (subBankPath.length === 0) {
            // Filter out the sub-bank to delete
            const updatedSubBanks = parentSubBanks.filter(sb => sb._id.toString() !== subBankId);
            
            // Update the bank with the filtered sub-banks
            return await this.bankRepository.updateBank(bankId, { sub_banks: updatedSubBanks });
        } else {
            // Navigate through the path to find the parent of the target sub-bank
            let currentLevel = bank.sub_banks || [];
            let path = [...subBankPath]; // Clone the path array
            
            // Navigate to the parent of the sub-bank to delete
            for (let i = 0; i < path.length; i++) {
                const pathId = path[i];
                const subBankIndex = currentLevel.findIndex(sb => sb._id.toString() === pathId);
                
                if (subBankIndex === -1) return null; // Path not found
                
                if (i === path.length - 1) {
                    // We've reached the parent of the sub-bank to delete
                    // Filter out the sub-bank to delete from its parent's sub_banks array
                    if (!currentLevel[subBankIndex].sub_banks) return null;
                    
                    currentLevel[subBankIndex].sub_banks = currentLevel[subBankIndex].sub_banks.filter(
                        sb => sb._id.toString() !== subBankId
                    );
                } else {
                    // Continue traversing the path
                    if (!currentLevel[subBankIndex].sub_banks) return null;
                    currentLevel = currentLevel[subBankIndex].sub_banks;
                }
            }
            
            // Update the bank with the modified sub-bank structure
            return await this.bankRepository.updateBank(bankId, { sub_banks: bank.sub_banks });
        }
    }
}
