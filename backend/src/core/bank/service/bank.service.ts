import { BankRepository } from "../repository/bank.repository";
import { IBank } from "../model/interface/ibank";
import { ISubBank } from "../model/interface/isub-bank";
import mongoose from "mongoose";
import { UserService } from "../../user/service/user.service";
import { UserRepoFactory } from "../../user/repository/user.factory";

export class BankService {
    private bankRepository: BankRepository;
    private readonly MAX_SUB_BANK_DEPTH = 3; // Maximum allowed depth for sub-banks

    constructor() {
        this.bankRepository = new BankRepository();
    }
    
    /**
     * Calculate the current depth where user is located
     * Level 1: Main bank (subBankPath = [])
     * Level 2: Direct sub-bank of main bank (subBankPath = [subbank1])
     * Level 3: Sub-bank of a sub-bank (subBankPath = [subbank1, subbank2]) - maximum allowed
     */
    private calculateCurrentDepth(subBankPath: string[]): number {
        return subBankPath.length + 1; // +1 because we're counting the current location depth
    }
    
    /**
     * Validate if creating a sub-bank at the given path would exceed maximum depth
     */
    
    private validateSubBankDepth(subBankPath: string[]): { isValid: boolean; currentDepth: number; maxDepth: number } {
        const currentDepth = this.calculateCurrentDepth(subBankPath);
        // Can create sub-bank only if current depth < max depth
        // At depth 3, no more sub-banks can be created (would be depth 4)
        return {
            isValid: currentDepth < this.MAX_SUB_BANK_DEPTH,
            currentDepth,
            maxDepth: this.MAX_SUB_BANK_DEPTH
        };
    }
    
    /**
     * Check if sub-bank creation is allowed at the current path
     * This method is exposed to the frontend to determine UI state
     */
    async canCreateSubBank(bankId: string, subBankPath: string[]): Promise<{
        canCreate: boolean;
        currentDepth: number;
        maxDepth: number;
        reason?: string;
    }> {
        // Validate that the bank exists
        const bank = await this.bankRepository.getBankById(bankId);
        if (!bank) {
            return {
                canCreate: false,
                currentDepth: 0,
                maxDepth: this.MAX_SUB_BANK_DEPTH,
                reason: 'Bank not found'
            };
        }
        
        // Validate depth
        const depthValidation = this.validateSubBankDepth(subBankPath);
        
        return {
            canCreate: depthValidation.isValid,
            currentDepth: depthValidation.currentDepth,
            maxDepth: depthValidation.maxDepth,
            reason: depthValidation.isValid ? undefined : 
                (depthValidation.currentDepth === depthValidation.maxDepth ? 
                    `Maximum folder depth of ${depthValidation.maxDepth} levels reached. You can still create exams here.` :
                    `Maximum depth of ${depthValidation.maxDepth} levels would be exceeded`)
        };
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

    async getBanksByIds(bankIds: string[]): Promise<IBank[]> {
        return await this.bankRepository.getBanksByIds(bankIds);
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
    
    async updateBank(id: string, bankData: Partial<IBank>): Promise<IBank | null> {
        return await this.bankRepository.updateBank(id, bankData);
    }

    async deleteBank(id: string, instructorId: string): Promise<IBank | null> {
        console.log(`Deleting bank ${id} with cascade deletion of all examinations`);
        
        // Get the bank first to access its exam IDs and sub-banks
        const bank = await this.bankRepository.getBankById(id);
        const userRepo = new UserRepoFactory().createRepository('instructor');
        const user = await userRepo.findById(instructorId);

        if (!user) {
            console.log(`User ${instructorId} not found`);
            return null;
        }
        
        if (!bank) {
            console.log(`Bank ${id} not found`);
            return null;
        }
        
        // Collect all exam IDs from the bank and its nested sub-banks
        const examIdsToDelete: string[] = [];
        
        // Add direct exam IDs from the bank
        if (bank.exam_ids && bank.exam_ids.length > 0) {
            examIdsToDelete.push(...bank.exam_ids);
            console.log(`Found ${bank.exam_ids.length} direct exams in bank`);
        }
        
        // Recursively collect exam IDs from all sub-banks
        if (bank.sub_banks && bank.sub_banks.length > 0) {
            for (const subBank of bank.sub_banks) {
                const subBankExamIds = this.collectAllExamIds(subBank);
                examIdsToDelete.push(...subBankExamIds);
            }
            console.log(`Found ${examIdsToDelete.length - (bank.exam_ids?.length || 0)} exams in sub-banks`);
        }
        
        console.log(`Total exams to delete: ${examIdsToDelete.length}`);
        
        // Delete all examinations from the database
        if (examIdsToDelete.length > 0) {
            await this.deleteExaminations(examIdsToDelete);
        }
        
        // Finally, delete the bank itself
        const deletedBank = await this.bankRepository.deleteBank(id);
        const deletedBankFromUser = await user.updateOne({ user_id: instructorId }, { $pull: { bank: id } }).exec();
        console.log(`Successfully deleted bank ${id} and all its examinations`);
        
        return deletedBank;
    }

    async createSubBank(bankId: string, name: string, examIds?: string[], parentId?: string): Promise<IBank | null> {
        // Direct sub-bank creation (level 1) is always allowed
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
        
        // Validate depth before proceeding
        const depthValidation = this.validateSubBankDepth(subBankPath);
        if (!depthValidation.isValid) {
            const error = `Cannot create sub-bank: Maximum depth of ${depthValidation.maxDepth} levels exceeded. Current depth would be ${depthValidation.currentDepth}.`;
            console.error(error);
            throw new Error(error);
        }
        
        console.log(`Sub-bank depth validation passed: ${depthValidation.currentDepth}/${depthValidation.maxDepth}`);
        
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
        
        // Handle the case where the first path ID is the root bank ID itself
        let pathToProcess = [...subBankPath];
        console.log('Path to process:', pathToProcess);
        
        // If the first ID in the path is the current bank ID, remove it
        if (pathToProcess.length > 0 && pathToProcess[0] === bankId) {
            console.log('First ID in path matches bank ID, removing it from path');
            pathToProcess = pathToProcess.slice(1);
        }
        
        // If after removing the root bank ID, we have an empty path, just add directly to the bank
        if (pathToProcess.length === 0) {
            console.log('After processing, path is empty. Adding directly to bank');
            if (!bank.sub_banks) {
                bank.sub_banks = [];
            }
            bank.sub_banks.push(newSubBank as ISubBank);
            const updatedBank = await this.bankRepository.updateBank(bankId, { sub_banks: bank.sub_banks });
            return updatedBank;
        } 
        
        // If we only have one ID left (the parent ID), look for it directly in the bank's sub-banks
        if (pathToProcess.length === 1) {
            console.log('Single ID path, looking directly in bank\'s sub-banks');
            const parentSubBankIndex = bank.sub_banks?.findIndex(sb => sb._id.toString() === pathToProcess[0]);
            
            if (parentSubBankIndex !== undefined && parentSubBankIndex !== -1) {
                if (!bank.sub_banks![parentSubBankIndex].sub_banks) {
                    bank.sub_banks![parentSubBankIndex].sub_banks = [];
                }
                bank.sub_banks![parentSubBankIndex].sub_banks.push(newSubBank as ISubBank);
                console.log('Bank after adding sub-bank:', bank);
                console.log('Added new sub-bank to parent at index', parentSubBankIndex);
                const updatedBank = await this.bankRepository.updateBank(bankId, { sub_banks: bank.sub_banks });
                return updatedBank;
            }
        }
        
        // For deeper nesting, use the recursive function
        // Function to recursively find and update a sub-bank
        const findAndAddSubBank = (subBanks: ISubBank[], path: string[], currentIndex: number): boolean => {
            // If we've reached the end of the path, we've found the parent
            if (currentIndex >= path.length) return false;
            
            const currentPathId = path[currentIndex];
            const subBankIndex = subBanks.findIndex(sb => sb._id.toString() === currentPathId);
            
            if (subBankIndex === -1) {
                console.log('Sub-bank not found in path at index', currentIndex, 'looking for ID:', currentPathId);
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
        
        // Start the recursive search from the root level, using the processed path
        if (!findAndAddSubBank(bank.sub_banks || [], pathToProcess, 0)) {
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
    
    async removeExamFromBank(bankId: string, examId: string): Promise<IBank | null> {
        const bank = await this.bankRepository.getBankById(bankId);
        if (!bank || !bank.exam_ids) return null;

        // Remove the exam ID from the bank's exam_ids array
        bank.exam_ids = bank.exam_ids.filter(id => id !== examId);

        // Also delete the examination document from the database
        try {
            const { ExaminationService } = await import('../../examination/service/exam.service');
            const examService = new ExaminationService();
            await examService.deleteExamination(examId);
            console.log(`Successfully deleted examination ${examId} from database`);
        } catch (error) {
            console.error(`Failed to delete examination ${examId}:`, error);
            // Continue with bank update even if exam deletion fails
        }

        // Update the bank in the repository
        return await this.bankRepository.updateBank(bankId, { exam_ids: bank.exam_ids });
    }

    async removeExamFromSubBank(bankId: string, subBankPath: string[], examId: string): Promise<IBank | null> {
        const bank = await this.bankRepository.getBankById(bankId);
        if (!bank) return null;
        
        // Find the target sub-bank using the path
        let currentSubBanks = bank.sub_banks || [];
        let targetSubBank: ISubBank | undefined;
        
        // If subBankPath is empty, we need to find the sub-bank directly in the bank's sub_banks
        // The examId parameter should actually be the subBankId in this case
        if (subBankPath.length === 0) {
            // When path is empty, we're looking for a direct child sub-bank
            // The examId in the route actually represents the subBankId
            console.error('removeExamFromSubBank called with empty path - this should not happen');
            return null;
        }
        
        // Navigate through the path to find the target sub-bank
        for (let i = 0; i < subBankPath.length; i++) {
            const subBankId = subBankPath[i];
            targetSubBank = currentSubBanks.find(sb => sb._id.toString() === subBankId);
            if (!targetSubBank) {
                console.error(`Sub-bank not found at path index ${i}, subBankId: ${subBankId}`);
                return null;
            }
            
            // If this is the last item in the path, this is our target sub-bank
            if (i === subBankPath.length - 1) {
                break;
            }
            
            // Otherwise, continue to the next level
            currentSubBanks = targetSubBank.sub_banks || [];
        }
        
        if (!targetSubBank || !targetSubBank.exam_ids) {
            console.error('Target sub-bank not found or has no exam_ids');
            return null;
        }
        
        console.log(`Removing exam ${examId} from sub-bank ${targetSubBank.name}`);
        
        // Remove the exam ID from the sub-bank
        targetSubBank.exam_ids = targetSubBank.exam_ids.filter(id => id !== examId);
        
        // Also delete the examination document from the database
        try {
            const { ExaminationService } = await import('../../examination/service/exam.service');
            const examService = new ExaminationService();
            await examService.deleteExamination(examId);
            console.log(`Successfully deleted examination ${examId} from database`);
        } catch (error) {
            console.error(`Failed to delete examination ${examId}:`, error);
            // Continue with bank update even if exam deletion fails
        }
        
        // Update the bank in the repository
        return await this.bankRepository.updateBank(bankId, { sub_banks: bank.sub_banks });
    }

    /**
     * Remove an exam from all banks and sub-banks when an exam is deleted
     * This should be called before deleting an exam to maintain data consistency
     */
    async removeExamFromAllBanks(examId: string): Promise<void> {
        console.log(`Removing exam ${examId} from all banks and sub-banks`);
        
        // Step 1: Find all banks that directly contain the exam
        const banksWithExam = await this.bankRepository.getBanksByExamId(examId);
        console.log(`Found ${banksWithExam.length} banks with exam ID`);
        
        // Step 2: Remove the exam from each bank's exam_ids array
        for (const bank of banksWithExam) {
            await this.removeExamFromBank(bank._id.toString(), examId);
        }
        
        // Step 3: Handle sub-banks - we need to check all banks to find sub-banks with the exam
        const allBanks = await this.bankRepository.getAllBanks();
        
        for (const bank of allBanks) {
            // Skip if bank has no sub-banks
            if (!bank.sub_banks || bank.sub_banks.length === 0) continue;
            
            // Define recursive function to find and update sub-banks
            const removeExamFromSubBankRecursive = (subBanks: ISubBank[], path: string[] = []): boolean => {
                let modified = false;
                
                for (let i = 0; i < subBanks.length; i++) {
                    const currentSubBank = subBanks[i];
                    const currentPath = [...path, currentSubBank._id.toString()];
                    
                    // Check if this sub-bank contains the exam
                    if (currentSubBank.exam_ids && currentSubBank.exam_ids.includes(examId)) {
                        // Remove the exam ID
                        currentSubBank.exam_ids = currentSubBank.exam_ids.filter(id => id !== examId);
                        modified = true;
                    }
                    
                    // Recursively check nested sub-banks
                    if (currentSubBank.sub_banks && currentSubBank.sub_banks.length > 0) {
                        const nestedModified = removeExamFromSubBankRecursive(currentSubBank.sub_banks, currentPath);
                        if (nestedModified) {
                            modified = true;
                        }
                    }
                }
                
                return modified;
            };
            
            // Process all sub-banks and update the bank if changes were made
            const bankModified = removeExamFromSubBankRecursive(bank.sub_banks);
            if (bankModified) {
                await this.bankRepository.updateBank(bank._id.toString(), { sub_banks: bank.sub_banks });
            }
        }
    }

    // Helper method to navigate through the nested structure
    async getSubBankHierarchy(bankId: string, instructorId?: string): Promise<IBank | ISubBank | null> {
        console.log('Fetching sub-bank hierarchy for bank ID:', bankId);
        return await this.bankRepository.getHierarchyById(bankId, instructorId);
    }
    
    /**
     * Get a sub-bank hierarchy using both parent bank ID and sub-bank ID
     * This allows direct navigation to deeply nested sub-banks
     */
    async getSubBankHierarchyByParentAndId(parentBankId: string, subBankId: string): Promise<{
        parentBank: IBank | null,
        subBank: ISubBank | null,
        breadcrumbPath: string[]
    }> {
        console.log(`Fetching sub-bank hierarchy for parent ID: ${parentBankId} and sub-bank ID: ${subBankId}`);
        return await this.bankRepository.getSubBankByParentAndId(parentBankId, subBankId);
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
        
        // First, find the sub-bank to delete and collect all exam IDs for cascade deletion
        const subBankToDelete = await this.findSubBankToDelete(bank, subBankPath, subBankId);
        if (!subBankToDelete) return null;
        
        // Collect all exam IDs from the sub-bank and its nested sub-banks
        const examIdsToDelete = this.collectAllExamIds(subBankToDelete);
        
        // Delete all examinations from the database (cascade deletion)
        if (examIdsToDelete.length > 0) {
            console.log(`Cascade deleting ${examIdsToDelete.length} examinations:`, examIdsToDelete);
            await this.deleteExaminations(examIdsToDelete);
        }
        
        // Now proceed with deleting the sub-bank from the hierarchy
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
    
    // Helper method to find the sub-bank to delete
    private async findSubBankToDelete(bank: IBank, subBankPath: string[], subBankId: string): Promise<ISubBank | null> {
        let currentLevel = bank.sub_banks || [];
        
        // If subBankPath is empty, we're looking for a direct child of the bank
        if (subBankPath.length === 0) {
            return currentLevel.find(sb => sb._id.toString() === subBankId) || null;
        }
        
        // Navigate through the path to find the target sub-bank
        for (let i = 0; i < subBankPath.length; i++) {
            const pathId = subBankPath[i];
            const subBankIndex = currentLevel.findIndex(sb => sb._id.toString() === pathId);
            
            if (subBankIndex === -1) return null; // Path not found
            
            if (i === subBankPath.length - 1) {
                // We've reached the parent, now find the target sub-bank
                const parentSubBank = currentLevel[subBankIndex];
                if (!parentSubBank.sub_banks) return null;
                return parentSubBank.sub_banks.find(sb => sb._id.toString() === subBankId) || null;
            } else {
                // Continue traversing the path
                if (!currentLevel[subBankIndex].sub_banks) return null;
                currentLevel = currentLevel[subBankIndex].sub_banks;
            }
        }
        
        return null;
    }
    
    // Helper method to collect all exam IDs from a sub-bank and its nested sub-banks
    private collectAllExamIds(subBank: ISubBank): string[] {
        const examIds: string[] = [];
        
        // Add exam IDs from the current sub-bank
        if (subBank.exam_ids && subBank.exam_ids.length > 0) {
            examIds.push(...subBank.exam_ids);
        }
        
        // Recursively collect exam IDs from nested sub-banks
        if (subBank.sub_banks && subBank.sub_banks.length > 0) {
            for (const nestedSubBank of subBank.sub_banks) {
                const nestedExamIds = this.collectAllExamIds(nestedSubBank);
                examIds.push(...nestedExamIds);
            }
        }
        
        return examIds;
    }
    
    // Helper method to delete examinations from the database
    private async deleteExaminations(examIds: string[]): Promise<void> {
        // Import the ExaminationService dynamically to avoid circular dependencies
        const { ExaminationService } = await import('../../examination/service/exam.service');
        const examService = new ExaminationService();
        
        // Delete each examination
        for (const examId of examIds) {
            try {
                await examService.deleteExamination(examId);
                console.log(`Successfully deleted examination: ${examId}`);
            } catch (error) {
                console.error(`Failed to delete examination ${examId}:`, error);
                // Continue with other deletions even if one fails
            }
        }
    }
    
    // Simple rename method for sub-banks
    async renameSubBank(parentId: string, subBankId: string, newName: string): Promise<IBank | null> {
        // Get the parent bank
        const parentBank = await this.bankRepository.getBankById(parentId);
        if (!parentBank) return null;
        
        // Function to recursively find and rename the sub-bank
        const findAndRename = (subBanks: ISubBank[]): boolean => {
            for (let i = 0; i < subBanks.length; i++) {
                if (subBanks[i]._id.toString() === subBankId) {
                    // Found the target sub-bank, rename it
                    subBanks[i].name = newName;
                    return true;
                }
                
                // If this sub-bank has nested sub-banks, search them too
                const nestedSubBanks = subBanks[i].sub_banks;
                if (nestedSubBanks && nestedSubBanks.length > 0) {
                    if (findAndRename(nestedSubBanks)) {
                        return true;
                    }
                }
            }
            return false;
        };
        
        // Find and rename the sub-bank
        if (parentBank.sub_banks && findAndRename(parentBank.sub_banks)) {
            // Update the bank with the renamed sub-bank
            return await this.bankRepository.updateBank(parentId, { sub_banks: parentBank.sub_banks });
        }
        
        return null;
    }
    
    // Simple add exam to sub-bank method
    async addExamToSubBankSimple(parentId: string, subBankId: string, examId: string): Promise<IBank | null> {
        // Get the parent bank
        const parentBank = await this.bankRepository.getBankById(parentId);
        if (!parentBank) return null;
        
        // Function to recursively find and add exam to the sub-bank
        const findAndAddExam = (subBanks: ISubBank[]): boolean => {
            for (let i = 0; i < subBanks.length; i++) {
                if (subBanks[i]._id.toString() === subBankId) {
                    // Found the target sub-bank, add exam ID
                    if (!subBanks[i].exam_ids) {
                        subBanks[i].exam_ids = [];
                    }
                    // Only add if not already present
                    if (!subBanks[i].exam_ids!.includes(examId)) {
                        subBanks[i].exam_ids!.push(examId);
                    }
                    return true;
                }
                
                // If this sub-bank has nested sub-banks, search them too
                const nestedSubBanks = subBanks[i].sub_banks;
                if (nestedSubBanks && nestedSubBanks.length > 0) {
                    if (findAndAddExam(nestedSubBanks)) {
                        return true;
                    }
                }
            }
            return false;
        };
        
        // Find and add exam to the sub-bank
        if (parentBank.sub_banks && findAndAddExam(parentBank.sub_banks)) {
            // Update the bank with the modified sub-bank
            return await this.bankRepository.updateBank(parentId, { sub_banks: parentBank.sub_banks });
        }
        
        return null;
    }
    
    /**
     * Validate if sub-bank creation is allowed within a specific sub-bank
     * This method takes parent bank ID and sub-bank ID to find the exact location
     */
    async canCreateSubBankInSubBank(parentBankId: string, subBankId: string): Promise<{
        canCreate: boolean;
        currentDepth: number;
        maxDepth: number;
        reason?: string;
    }> {
        console.log(`Validating sub-bank creation within sub-bank ${subBankId} of parent bank ${parentBankId}`);
        
        // Get the parent bank
        const bank = await this.bankRepository.getBankById(parentBankId);
        if (!bank) {
            return {
                canCreate: false,
                currentDepth: 0,
                maxDepth: this.MAX_SUB_BANK_DEPTH,
                reason: 'Parent bank not found'
            };
        }
        
        // Find the target sub-bank and calculate its depth
        const subBankInfo = this.findSubBankWithDepth(bank.sub_banks || [], subBankId, 1);
        
        if (!subBankInfo) {
            return {
                canCreate: false,
                currentDepth: 0,
                maxDepth: this.MAX_SUB_BANK_DEPTH,
                reason: 'Target sub-bank not found'
            };
        }
        
        // The current sub-bank depth represents how deep we already are
        // If we're at depth 3 (max), we cannot create more sub-banks
        console.log(`Current sub-bank depth: ${subBankInfo.depth}, Max depth: ${this.MAX_SUB_BANK_DEPTH}`);
        
        // Check if we're already at maximum depth
        if (subBankInfo.depth >= this.MAX_SUB_BANK_DEPTH) {
            return {
                canCreate: false,
                currentDepth: subBankInfo.depth,
                maxDepth: this.MAX_SUB_BANK_DEPTH,
                reason: `Already at maximum depth of ${this.MAX_SUB_BANK_DEPTH} levels. Cannot create more sub-banks.`
            };
        }
        
        console.log('Sub-bank creation within sub-bank validation passed');
        return {
            canCreate: true,
            currentDepth: subBankInfo.depth,
            maxDepth: this.MAX_SUB_BANK_DEPTH,
            reason: `Sub-bank creation at depth ${subBankInfo.depth + 1} is allowed`
        };
    }
    
    /**
     * Create a sub-bank within a specific sub-bank using parent bank ID and target sub-bank ID
     */
    async createSubBankInSubBank(parentBankId: string, subBankId: string, name: string, examIds?: string[]): Promise<IBank> {
        console.log(`Creating sub-bank '${name}' within sub-bank ${subBankId} of parent bank ${parentBankId}`);
        
        // Get the parent bank
        const bank = await this.bankRepository.getBankById(parentBankId);
        if (!bank) {
            throw new Error('Parent bank not found');
        }
        
        // Find the target sub-bank where we want to create the new sub-bank
        const targetSubBank = this.findSubBankById(bank.sub_banks || [], subBankId);
        if (!targetSubBank) {
            throw new Error('Target sub-bank not found');
        }
        
        // Validate depth before creation
        const validation = await this.canCreateSubBankInSubBank(parentBankId, subBankId);
        if (!validation.canCreate) {
            throw new Error(validation.reason || 'Sub-bank creation not allowed');
        }
        
        // Create new sub-bank object
        const newSubBank: ISubBank = {
            _id: new mongoose.Types.ObjectId() as any,
            name: name,
            exam_ids: examIds || [],
            sub_banks: []
        };
        
        // Add the new sub-bank to the target sub-bank
        if (!targetSubBank.sub_banks) {
            targetSubBank.sub_banks = [];
        }
        targetSubBank.sub_banks.push(newSubBank);
        
        // Update the bank in the database
        const updatedBank = await this.bankRepository.updateBank(parentBankId, bank);
        if (!updatedBank) {
            throw new Error('Failed to update bank');
        }
        
        console.log(`Sub-bank '${name}' created successfully within sub-bank ${subBankId}`);
        return updatedBank;
    }
    
    /**
     * Helper method to find a sub-bank by ID recursively
     */
    private findSubBankById(subBanks: ISubBank[], targetId: string): ISubBank | null {
        for (const subBank of subBanks) {
            if (subBank._id.toString() === targetId) {
                return subBank;
            }
            
            // Recursively search in nested sub-banks
            if (subBank.sub_banks && subBank.sub_banks.length > 0) {
                const found = this.findSubBankById(subBank.sub_banks, targetId);
                if (found) {
                    return found;
                }
            }
        }
        return null;
    }
    
    /**
     * Helper method to find a sub-bank by ID and return its depth
     */
    private findSubBankWithDepth(subBanks: ISubBank[], targetId: string, currentDepth: number): { subBank: ISubBank; depth: number } | null {
        for (const subBank of subBanks) {
            if (subBank._id.toString() === targetId) {
                return { subBank, depth: currentDepth };
            }
            
            // Recursively search in nested sub-banks
            if (subBank.sub_banks && subBank.sub_banks.length > 0) {
                const found = this.findSubBankWithDepth(subBank.sub_banks, targetId, currentDepth + 1);
                if (found) {
                    return found;
                }
            }
        }
        return null;
    }

    /**
     * Get the maximum allowed depth for sub-banks
     */
    getMaxSubBankDepth(): number {
        return this.MAX_SUB_BANK_DEPTH;
    }

}
