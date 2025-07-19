"use client";

import React, { useEffect, useState } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Breadcrumbs, BreadcrumbItem, Card, CardBody, Spinner } from "@nextui-org/react";
import { SolarRefreshLineDuotone, BankAdd, ExamFile, MingcuteRightFill, IcRoundFolder, MaterialSymbolsFolderOutlineRounded, BankEmpty, BankFill } from "../icons/icons";
import { clientAPI } from "@/config/axios.config";
import { errorHandler } from "@/utils/error";
import { toast } from "react-toastify";

// Define interfaces matching the bank-list.tsx structure
interface ServerResponse<T> {
    data: T;
    message?: string;
    status?: number;
}

type Bank = {
    _id: string;
    bank_name?: string;
    name?: string; // For sub-banks
    exam_id?: string;
    exam_ids?: string[];
    sub_banks?: any[];
};

type Examination = {
    _id: string;
    title: string;
    description?: string;
    created_at?: string;
};

type BreadcrumbItem = {
    id: string;
    name: string;
};

interface ExamSelectorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectExam?: (exam: Examination) => void;
    // Multi-selection support
    selectedExamIds?: string[];
    onExamSelectionChange?: (examIds: string[]) => void;
    allowMultiSelect?: boolean;
    title?: string;
    instructorId?: string;
}

const ExamSelectorModal: React.FC<ExamSelectorModalProps> = ({
    isOpen,
    onClose,
    onSelectExam,
    selectedExamIds = [],
    onExamSelectionChange,
    allowMultiSelect = false,
    title = "Select Examination",
    instructorId
}) => {
    // State management similar to bank-list.tsx
    const [currentBanks, setCurrentBanks] = useState<Bank[]>([]);
    const [currentExams, setCurrentExams] = useState<Examination[]>([]);
    const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);
    const [currentBankId, setCurrentBankId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingSubBanks, setIsLoadingSubBanks] = useState(false);
    const [isLoadingExams, setIsLoadingExams] = useState(false);
    const [rootBanks, setRootBanks] = useState<Bank[]>([]);

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            resetToRoot();
        }
    }, [isOpen, instructorId]);

    // Reset to root level
    const resetToRoot = async () => {
        setBreadcrumbs([]);
        setCurrentBankId(null);
        setCurrentExams([]);
        await fetchTopLevelBanks();
    };

    // Fetch top-level banks
    const fetchTopLevelBanks = async () => {
        setIsLoading(true);
        try {
            const endpoint = instructorId ? `user/bank/${instructorId}` : 'bank';
            const response = await clientAPI.get(endpoint);
            
            if (response.data?.data) {
                const banks = response.data.data as Bank[];
                setCurrentBanks(banks);
                setRootBanks(banks);
            }
        } catch (error) {
            console.error('Error fetching banks:', error);
            errorHandler(error);
        } finally {
            setIsLoading(false);
        }
    };

    // Helper function to recursively process sub-banks at all nesting levels
    const processSubBanksRecursively = (banks: any[]): any[] => {
        return banks.map(bank => {
            if (bank.sub_banks && bank.sub_banks.length > 0) {
                return {
                    ...bank,
                    sub_banks: processSubBanksRecursively(bank.sub_banks)
                };
            }
            return bank;
        });
    };

    // Fetch sub-banks for a specific bank
    const fetchSubBanks = async (subBankId: string): Promise<any[]> => {
        setIsLoadingSubBanks(true);
        try {
            const response = await clientAPI.get(`bank/bank-${subBankId}`);
            
            if (response.data?.data?.sub_banks) {
                return processSubBanksRecursively(response.data.data.sub_banks);
            }
            return [];
        } catch (error) {
            console.error('Error fetching sub-banks:', error);
            errorHandler(error);
            return [];
        } finally {
            setIsLoadingSubBanks(false);
        }
    };

    // Fetch examinations for given exam IDs
    const fetchExaminations = async (examIds: string[]): Promise<Examination[]> => {
        if (!examIds || examIds.length === 0) return [];
        
        setIsLoadingExams(true);
        try {
            const examPromises = examIds.map(async (examId) => {
                try {
                    const response = await clientAPI.get(`exam/${examId}`);
                    return response.data?.data || null;
                } catch (error) {
                    console.error(`Error fetching exam ${examId}:`, error);
                    return null;
                }
            });
            
            const exams = await Promise.all(examPromises);
            return exams.filter(exam => exam !== null) as Examination[];
        } catch (error) {
            console.error('Error fetching examinations:', error);
            return [];
        } finally {
            setIsLoadingExams(false);
        }
    };

    // Handle bank click (navigation)
    const handleBankClick = async (bank: Bank) => {
        setCurrentBankId(bank._id);
        
        // Add current bank to breadcrumbs
        const newBreadcrumb = {
            id: bank._id,
            name: (bank as any).bank_name || (bank as any).name || 'Unnamed Bank'
        };
        setBreadcrumbs(prev => [...prev, newBreadcrumb]);

        // Check if bank has embedded sub-banks
        if (bank.sub_banks && bank.sub_banks.length > 0) {
            setCurrentBanks(processSubBanksRecursively(bank.sub_banks));
        } else {
            // Fetch sub-banks from API
            const subBanks = await fetchSubBanks(bank._id);
            setCurrentBanks(subBanks);
        }

        // Fetch examinations if there are exam IDs
        if (bank.exam_ids && bank.exam_ids.length > 0) {
            const exams = await fetchExaminations(bank.exam_ids);
            setCurrentExams(exams);
        } else if (bank.exam_id) {
            // Handle legacy single exam_id
            const exams = await fetchExaminations([bank.exam_id]);
            setCurrentExams(exams);
        } else {
            setCurrentExams([]);
        }
    };

    // Handle breadcrumb click
    const handleBreadcrumbClick = async (clickedIndex: number) => {
        if (clickedIndex === -1) {
            // Navigate to root
            await resetToRoot();
            return;
        }

        const targetBreadcrumb = breadcrumbs[clickedIndex];
        const newBreadcrumbs = breadcrumbs.slice(0, clickedIndex + 1);
        setBreadcrumbs(newBreadcrumbs);
        setCurrentBankId(targetBreadcrumb.id);

        try {
            // Fetch the target bank's sub-banks and exams
            const subBanks = await fetchSubBanks(targetBreadcrumb.id);
            setCurrentBanks(subBanks);

            // Find the bank data to get exam IDs
            const response = await clientAPI.get(`bank/bank-${targetBreadcrumb.id}`);
            if (response.data?.data) {
                const bankData = response.data.data;
                if (bankData.exam_ids && bankData.exam_ids.length > 0) {
                    const exams = await fetchExaminations(bankData.exam_ids);
                    setCurrentExams(exams);
                } else {
                    setCurrentExams([]);
                }
            }
        } catch (error) {
            console.error('Error navigating to breadcrumb:', error);
            errorHandler(error);
        }
    };

    // Handle exam selection
    const handleExamClick = (exam: Examination) => {
        if (allowMultiSelect && onExamSelectionChange) {
            // Multi-selection mode
            const isSelected = selectedExamIds.includes(exam._id);
            let updatedExamIds: string[];
            
            if (isSelected) {
                // Remove from selection
                updatedExamIds = selectedExamIds.filter(id => id !== exam._id);
            } else {
                // Add to selection
                updatedExamIds = [...selectedExamIds, exam._id];
            }
            
            onExamSelectionChange(updatedExamIds);
            // Don't close modal in multi-select mode
        } else {
            // Single selection mode
            if (onSelectExam) {
                onSelectExam(exam);
            }
            onClose();
        }
    };

    // Render bank card (matching bank-list.tsx style)
    const renderBankCard = (bank: Bank) => {
        const subBankCount = bank.sub_banks?.length || 0;
        const examCount = bank.exam_ids?.length || 0;
        const isEmpty = subBankCount === 0 && examCount === 0;
        
        return (
            <Card 
                key={bank._id}
                className="w-[150px] hover:bg-default-100 cursor-pointer transition-colors"
                isPressable
                onPress={() => handleBankClick(bank)}
            >
                <CardBody className="p-4 text-center">
                    <div className="flex flex-col items-center gap-2">
                        {isEmpty ? 
                            <BankEmpty className="w-12 h-12 text-blue-500" /> : 
                            <BankFill className="w-12 h-12 text-blue-500" />
                        }
                        <div className="w-full">
                            <h3 className="font-medium text-sm truncate" title={bank.bank_name || bank.name}>
                                {bank.bank_name || bank.name}
                            </h3>
                            <div className="flex items-center justify-center gap-3 mt-2 text-xs text-gray-500">
                                {subBankCount > 0 && (
                                    <span className="flex items-center gap-1">
                                        <BankFill className="w-3 h-3" />
                                        {subBankCount}
                                    </span>
                                )}
                                {examCount > 0 && (
                                    <span className="flex items-center gap-1">
                                        <ExamFile className="w-3 h-3" />
                                        {examCount}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </CardBody>
            </Card>
        );
    };

    // Render exam card (matching bank-list.tsx style)
    const renderExamCard = (exam: Examination) => {
        const isSelected = allowMultiSelect && selectedExamIds.includes(exam._id);
        
        return (
            <Card 
                key={exam._id}
                className={`w-[150px] cursor-pointer transition-colors ${
                    isSelected ? 'ring-2 ring-secondary bg-secondary/10' : 'hover:bg-default-100'
                }`}
                isPressable
                onPress={() => handleExamClick(exam)}
            >
                <CardBody className="p-4 text-center">
                    <div className="flex flex-col items-center gap-2">
                        <div className="relative">
                            <ExamFile className={`w-12 h-12 ${
                                isSelected ? 'text-secondary' : 'text-green-500'
                            }`} />
                            {allowMultiSelect && isSelected && (
                                <div className="absolute -top-1 -right-1 w-5 h-5 bg-secondary rounded-full flex items-center justify-center">
                                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                </div>
                            )}
                        </div>
                        <div className="w-full">
                            <h3 className="font-medium text-sm truncate" title={exam.title}>
                                {exam.title}
                            </h3>
                            {exam.description && (
                                <p className="text-xs text-gray-500 truncate mt-1" title={exam.description}>
                                    {exam.description}
                                </p>
                            )}
                            {exam.created_at && (
                                <p className="text-xs text-gray-400 mt-2">
                                    {new Date(exam.created_at).toLocaleDateString()}
                                </p>
                            )}
                        </div>
                    </div>
                </CardBody>
            </Card>
        );
    };

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose}
            size="5xl"
            scrollBehavior="inside"
            classNames={{
                body: "p-4",
                base: "max-h-[90vh]"
            }}
        >
            <ModalContent>
                <ModalHeader className="flex flex-col gap-1">
                    <div className="flex items-center justify-between w-full">
                        <h2 className="text-xl font-semibold">{title}</h2>
                        
                    </div>
                </ModalHeader>
                
                <ModalBody>
                    {/* Loading States */}
                    {(isLoading || isLoadingSubBanks || isLoadingExams) && (
                        <div className="size-full flex gap-4 justify-center items-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-secondary"></div>
                        </div>
                    )}
                    
                    {/* Content Display */}
                    {!isLoading && !isLoadingSubBanks && !isLoadingExams && (
                        <div className="w-full">
                            {/* Breadcrumb navigation - always show root */}
                            <div className="flex items-center mb-4 text-sm">
                                <button
                                    onClick={() => handleBreadcrumbClick(-1)}
                                    className={`${breadcrumbs.length === 0 ? "text-secondary font-medium" : "text-secondary hover:underline"}`}
                                >
                                    Root
                                </button>
                                {breadcrumbs.map((crumb, idx) => (
                                    <div key={crumb.id} className="flex items-center">
                                        <span className="mx-2 text-gray-500">/</span>
                                        <button
                                            onClick={() => handleBreadcrumbClick(idx)}
                                            className={`${idx === breadcrumbs.length - 1
                                                    ? "text-white font-medium"
                                                    : "text-blue-600 hover:underline"
                                                }`}
                                        >
                                            {crumb.name}
                                        </button>
                                    </div>
                                ))}
                            </div>

                            {(currentBanks.length > 0 || currentExams.length > 0) ? (
                                <div className="flex flex-wrap justify-start gap-4">
                                    {/* Display all the bank cards */}
                                    {currentBanks.map(renderBankCard)}
                                    
                                    {/* Display all examination cards */}
                                    {isLoadingExams ? (
                                        <div className="w-[222px] h-32 flex items-center justify-center">
                                            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-secondary"></div>
                                        </div>
                                    ) : (
                                        currentExams.map(renderExamCard)
                                    )}
                                </div>
                            ) : (
                                <div className="size-full flex flex-col gap-4 justify-center items-center py-12">
                                    {breadcrumbs.length > 0 ? (
                                        <>
                                            <BankEmpty className="w-16 h-16 text-gray-300" />
                                            <h1 className="font-semibold">This folder is empty</h1>
                                            <p className="text-gray-500 text-center">
                                                No banks or examinations in this folder
                                            </p>
                                            <Button 
                                                variant="bordered" 
                                                onPress={() => handleBreadcrumbClick(-1)}
                                            >
                                                Back to Root
                                            </Button>
                                        </>
                                    ) : (
                                        <>
                                            <h1 className="font-semibold">No Banks or Examinations Found</h1>
                                            <p className="text-gray-500 text-center">
                                                No banks or examinations are available
                                            </p>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </ModalBody>
                {allowMultiSelect && (
                    <ModalFooter>
                        <Button 
                            color="danger" 
                            variant="light" 
                            onPress={onClose}
                        >
                            Cancel
                        </Button>
                        <Button 
                            color="secondary" 
                            onPress={onClose}
                        >
                            Done ({selectedExamIds.length} selected)
                        </Button>
                    </ModalFooter>
                )}
            </ModalContent>
        </Modal>
    );
};

export default ExamSelectorModal;