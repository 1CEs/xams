import { UserModel } from "../../user/model/user.model";
import { UserServiceFactory } from "../../user/service/user.factory";
import { BankModel } from "../model/bank.model";
import { IBank } from "../model/interface/ibank";
import { ISubBank } from "../model/interface/isub-bank";

export class BankRepository {
    async createBank(bank: Partial<IBank>): Promise<IBank> {
        return await BankModel.create(bank);
    }

    async getHierarchyById(id: string, instructorId?: string): Promise<IBank | ISubBank | null> {
        if (!instructorId) {
            throw new Error('Instructor ID is required');
        }

        const user = await new UserServiceFactory().createService('instructor').getUserById(instructorId)
        if (!user) {
            throw new Error('User not found');
        }

        const recursiveFind = async (sub_banks: ISubBank[]) => {
            for (const bank of sub_banks) {
                if (bank._id.toString() === id) {
                    return bank;
                } else {
                    return recursiveFind(bank.sub_banks || []);
                }
            }
            return null;
        }

        for (const bank_id of (user as any).bank) {
            const bank =  await BankModel.findById(bank_id.toString()).lean().exec() as IBank;
            
            if (bank === null) {
                continue;
            }

            if (bank._id.toString() === id) {
                return bank;
            } else {
                const result = await recursiveFind(bank.sub_banks || []);
                if (result) {
                    return result;
                }
            }
        }

        return null;
    }

    async getBankById(id: string, isHierarchy?: boolean): Promise<IBank | null> {
        return await BankModel.findById(id).lean().exec() as IBank;    }
    
    /**
     * Get a sub-bank using both parent bank ID and the sub-bank ID
     * This allows direct navigation to deeply nested sub-banks
     */
    async getSubBankByParentAndId(parentBankId: string, subBankId: string): Promise<{
        parentBank: IBank | null,
        subBank: ISubBank | null,
        breadcrumbPath: string[]
    }> {
        console.log(`Getting sub-bank by parent ID: ${parentBankId} and sub-bank ID: ${subBankId}`);
        
        // First get the parent bank with all its sub-banks
        const parentBank = await BankModel.findById(parentBankId).lean().exec() as IBank;
        if (!parentBank) {
            console.log(`Parent bank with ID ${parentBankId} not found`);
            return { parentBank: null, subBank: null, breadcrumbPath: [] };
        }
        
        // Initialize breadcrumb path with parent bank name
        const breadcrumbPath = [parentBank.bank_name];
        
        // Find the sub-bank recursively
        const findSubBankRecursively = (subBanks: ISubBank[], path: string[] = []): { 
            subBank: ISubBank | null, 
            path: string[] 
        } => {
            if (!subBanks || !Array.isArray(subBanks) || subBanks.length === 0) {
                return { subBank: null, path };
            }
            
            // Check direct children first
            for (const sb of subBanks) {
                if (sb._id.toString() === subBankId) {
                    return { 
                        subBank: sb, 
                        path: [...path, sb.name || sb.name  || 'Unknown'] 
                    };
                }
            }
            
            // If not found, recursively check nested sub-banks
            for (const sb of subBanks) {
                if (sb.sub_banks && sb.sub_banks.length > 0) {
                    const result = findSubBankRecursively(
                        sb.sub_banks, 
                        [...path, sb.name || sb.name || 'Unknown']
                    );
                    
                    if (result.subBank) {
                        return result;
                    }
                }
            }
            
            return { subBank: null, path };
        };
        
        // Search for the sub-bank within the parent bank
        const { subBank, path } = findSubBankRecursively(parentBank.sub_banks || []);
        
        if (subBank) {
            console.log(`Found sub-bank: ${subBank.name || subBank.name || 'Unknown'}`);
            console.log(`Path to sub-bank: ${path.join(' > ')}`);
        } else {
            console.log(`Sub-bank with ID ${subBankId} not found in parent bank ${parentBankId}`);
        }
        
        return { 
            parentBank, 
            subBank, 
            breadcrumbPath: breadcrumbPath.concat(path) 
        };
    }

    async getBanksByExamId(examId: string): Promise<IBank[]> {
        return await BankModel.find({ exam_ids: examId }).exec();
    }
    
    async getAllBanks(): Promise<IBank[]> {
        return await BankModel.find({}).exec();
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
