import { IBank } from "../../../core/bank/model/interface/ibank";
import { ISubBank } from "../../../core/bank/model/interface/isub-bank";

type ControllerResponse<T> = {
    message: string;
    code: number;
    data: T;
};

export interface IBankController {
    // Bank methods
    createBank: (bankName: string, examIds?: string | string[], instructorId?: string) => Promise<ControllerResponse<IBank | null>>;
    getBankById: (id: string) => Promise<ControllerResponse<IBank | null>>;
    getBanksByExamId: (examId: string) => Promise<ControllerResponse<IBank[] | null>>;
    updateBank: (id: string, payload: Partial<IBank>) => Promise<ControllerResponse<IBank | null>>;
    deleteBank: (id: string, instructorId: string) => Promise<ControllerResponse<IBank | null>>;
    
    // SubBank methods
    createSubBank: (bankId: string, name: string, examIds?: string | string[], parentId?: string) => Promise<ControllerResponse<IBank | null>>;
    createNestedSubBank: (bankId: string, subBankPath: string[], name: string, examIds?: string | string[]) => Promise<ControllerResponse<IBank | null>>;
    getSubBankHierarchy: (bankId: string) => Promise<ControllerResponse<IBank | ISubBank | null>>;
    
    // Exam management in banks
    addExamToBank: (bankId: string, examId: string) => Promise<ControllerResponse<IBank | null>>;
    removeExamFromBank: (bankId: string, examId: string) => Promise<ControllerResponse<IBank | null>>;
    
    // Exam management in sub-banks
    addExamToSubBank: (bankId: string, subBankPath: string[], examId: string) => Promise<ControllerResponse<IBank | null>>;
    removeExamFromSubBank: (bankId: string, subBankPath: string[], examId: string) => Promise<ControllerResponse<IBank | null>>;
    
    // Sub-bank management
    updateSubBank: (bankId: string, subBankPath: string[], subBankId: string, updateData: any) => Promise<ControllerResponse<IBank | null>>;
    deleteSubBank: (bankId: string, subBankPath: string[], subBankId: string) => Promise<ControllerResponse<IBank | null>>;
}
