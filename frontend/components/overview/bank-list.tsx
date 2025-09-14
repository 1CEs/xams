"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import BankCard from "../bank/bank-card";
import { SolarRefreshLineDuotone, BankAdd, ExamFile } from "../icons/icons";
import ExamFormModal from "./modals/exam-form-modal";
import ExamCard from "../exam/exam-card";
import { useUserStore } from "@/stores/user.store";
import { useBankNavigation, BankBreadcrumb } from "@/stores/bank-selector.store";
import { useFetch } from "@/hooks/use-fetch";
import { Alert, Button, Input, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Textarea, useDisclosure } from "@nextui-org/react";
import { BankResponse } from "@/types/bank";
import Link from "next/link";
import { clientAPI } from "@/config/axios.config";
import { errorHandler } from "@/utils/error";
import { toast } from "react-toastify";

// Define ServerResponse interface
interface ServerResponse<T> {
  data: T;
  message?: string;
  status?: number;
}

// Define a type that matches both our needs and the API response
type Bank = {
    _id: string;
    bank_name: string;
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

type BreadcrumbItem = BankBreadcrumb;

type Props = {
    examId?: string;
    searchQuery?: string;
    sortBy?: string;
};

const BankList = ({ examId, searchQuery = "", sortBy = "" }: Props) => {
    const router = useRouter();
    const { user } = useUserStore();
    const { data, error, isLoading, mutate } = useFetch<ServerResponse<BankResponse[]>>(examId ? `bank/by-exam/${examId}` : user ? `user/bank/${user._id}` : `bank`);

    // Use the persistent bank navigation store
    const {
        currentBankId,
        breadcrumbs,
        navigateTo,
        navigateToRoot,
        navigateToBreadcrumb: navigateToBreadcrumbInStore,
        setCurrentBank
    } = useBankNavigation();

    const [currentBanks, setCurrentBanks] = useState<Bank[]>([]);
    const [filteredBanks, setFilteredBanks] = useState<Bank[]>([]);
    const [filteredExams, setFilteredExams] = useState<Examination[]>([]);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isCreatingBank, setIsCreatingBank] = useState(false);
    const [newBankName, setNewBankName] = useState("");
    const [newBankParentId, setNewBankParentId] = useState<string | null>(null);

    // State for examination modal
    const [isExamModalOpen, setIsExamModalOpen] = useState(false);
    const [examBankContext, setExamBankContext] = useState<{
        bankId: string;
        subBankId?: string; // Keep for backward compatibility
        subBankPath?: string[];
    }>({ bankId: "" });
    const [isLoadingSubBanks, setIsLoadingSubBanks] = useState(false);

    // State for examinations
    const [currentExams, setCurrentExams] = useState<Examination[]>([]);
    const [isLoadingExams, setIsLoadingExams] = useState(false);
    
    // State for depth validation
    const [canCreateSubBank, setCanCreateSubBank] = useState(true);
    const [maxDepth, setMaxDepth] = useState(3);
    const [currentDepth, setCurrentDepth] = useState(1);
    const [depthValidationReason, setDepthValidationReason] = useState<string | undefined>();

    // Fetch maximum depth on component mount
    useEffect(() => {
        const fetchMaxDepth = async () => {
            try {
                const response = await clientAPI.get('/bank/max-depth');
                if (response.data && typeof response.data.data === 'number') {
                    setMaxDepth(response.data.data);
                }
            } catch (error) {
                console.error('Error fetching max depth:', error);
                // Keep default value of 3
            }
        };
        
        fetchMaxDepth();
    }, []);
    
    useEffect(() => {
        // If we're at the root level and data is loaded, set the current banks
        if (data && data.data && !currentBankId) {
            setCurrentBanks(data.data as unknown as Bank[]);
            setCurrentExams([]);
            
            // At root level (no breadcrumbs, no currentBankId), we can create sub-banks
            setCurrentDepth(0); // At root level, depth is 0
            setCanCreateSubBank(true); // Can always create banks at root level
            setDepthValidationReason(undefined);
        }
    }, [data, currentBankId]);

    // Filter and sort banks based on search query and sort option
    useEffect(() => {
        let banks = [...currentBanks];
        let exams = [...currentExams];
        
        // Apply search filter to banks
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            banks = banks.filter(bank => 
                bank.bank_name.toLowerCase().includes(query)
            );
            
            // Also filter exams
            exams = exams.filter(exam => 
                exam.title.toLowerCase().includes(query) ||
                exam.description?.toLowerCase().includes(query)
            );
        }
        
        // Apply sorting to banks
        if (sortBy) {
            banks.sort((a, b) => {
                switch (sortBy) {
                    case "name_asc":
                        return a.bank_name.localeCompare(b.bank_name);
                    case "name_desc":
                        return b.bank_name.localeCompare(a.bank_name);
                    case "created_newest":
                    case "created_oldest":
                        // Since creation date is not available, sort by name as fallback
                        return a.bank_name.localeCompare(b.bank_name);
                    default:
                        return 0;
                }
            });
            
            // Apply sorting to exams
            exams.sort((a, b) => {
                switch (sortBy) {
                    case "name_asc":
                        return a.title.localeCompare(b.title);
                    case "name_desc":
                        return b.title.localeCompare(a.title);
                    case "created_newest":
                        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
                    case "created_oldest":
                        return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
                    default:
                        return 0;
                }
            });
        }
        
        setFilteredBanks(banks);
        setFilteredExams(exams);
    }, [currentBanks, currentExams, searchQuery, sortBy]);
    
    // Separate effect to handle depth validation when navigation changes without currentBankId
    useEffect(() => {
        if (!currentBankId && breadcrumbs.length === 0) {
            // We're at the root level
            setCurrentDepth(0);
            setCanCreateSubBank(true);
            setDepthValidationReason(undefined);
            
            console.log('At root level - depth validation:', {
                currentDepth: 0,
                canCreateSubBank: true
            });
        }
    }, [currentBankId, breadcrumbs]);
    
    // Function to validate if sub-bank creation is allowed at current depth
    const validateSubBankCreation = async (bankId: string, subBankPath: string[]) => {
        try {
            let requestBody: any = {};
            let targetBankId = bankId;
            
            // Check if we're in a sub-bank context by looking at breadcrumbs
            if (breadcrumbs.length > 1) {
                // We're in a sub-bank context
                // First breadcrumb is the root bank, last breadcrumb is the current sub-bank
                const rootBankId = breadcrumbs[0].id;
                const currentSubBankId = breadcrumbs[breadcrumbs.length - 1].id;
                
                console.log('Validating sub-bank creation in sub-bank context:', {
                    rootBankId,
                    currentSubBankId,
                    breadcrumbs
                });
                
                requestBody = {
                    parentBankId: rootBankId,
                    subBankId: currentSubBankId
                };
                targetBankId = rootBankId; // Use root bank ID in URL
            } else {
                // We're in a direct bank context
                console.log('Validating sub-bank creation in direct bank context:', {
                    bankId,
                    subBankPath
                });
                
                requestBody = {
                    subBankPath: subBankPath
                };
            }
            
            const response = await clientAPI.post(`/bank/bank-${targetBankId}/can-create-subbank`, requestBody);
            
            if (response.data && response.data.data) {
                const validation = response.data.data;
                
                console.log('Backend validation result:', {
                    canCreate: validation.canCreate,
                    currentDepth: validation.currentDepth,
                    reason: validation.reason,
                    localCalculation: {
                        currentDepth: breadcrumbs.length,
                        canCreate: breadcrumbs.length < maxDepth
                    }
                });
                
                // Only override local state if backend explicitly disagrees and provides a reason
                // This prevents unnecessary overrides that could cause UI inconsistencies
                // IMPORTANT: Don't let the backend override local calculation for level 2 sub-banks
                // We're going to prioritize our local calculation for level 2
                const isAtLevel2 = breadcrumbs.length === 2;
                
                if (validation.reason && validation.currentDepth !== currentDepth && !isAtLevel2) {
                    console.log('Backend disagrees with local calculation, updating state');
                    setCanCreateSubBank(validation.canCreate);
                    setCurrentDepth(validation.currentDepth);
                    setDepthValidationReason(validation.reason);
                } else if (isAtLevel2) {
                    // At level 2, we force the ability to create sub-banks
                    console.log('At level 2, forcing canCreateSubBank = true');
                    // This ensures we can always create multiple sub-banks at level 2
                    setCanCreateSubBank(true);
                }
                
                return validation.canCreate;
            }
        } catch (error) {
            console.error('Error validating sub-bank creation:', error);
            // Don't override local state on API failure - let local calculation stand
            console.log('API validation failed, keeping local calculation');
            return breadcrumbs.length < maxDepth;
        }
        return true; // Default to allowing creation
    };

    // Effect to load sub-banks when currentBankId changes (from store)
    useEffect(() => {
        const loadSubBanks = async () => {
            if (currentBankId) {
                console.log('Loading sub-banks for bank ID:', currentBankId);
                console.log('Current breadcrumbs:', breadcrumbs);
                
                setIsLoadingSubBanks(true);
                setIsLoadingExams(true);
                
                // Fetch the sub-banks for the current bank ID
                const subBanks = await fetchSubBanks(currentBankId);
                
                // Log the structure to help with debugging
                console.log('Setting current banks to:', subBanks);
                
                // Update the state with the fetched sub-banks
                setCurrentBanks(subBanks);
                setIsLoadingSubBanks(false);
                
                // Depth validation logic
                // breadcrumbs already include the current location, so:
                // breadcrumbs.length = 1: root bank level (depth 1)
                // breadcrumbs.length = 2: first sub-bank (depth 2) 
                // breadcrumbs.length = 3: second sub-bank (depth 3) - MAX ALLOWED
                // etc.
                const calculatedDepth = breadcrumbs.length; // breadcrumbs already includes current location
                
                // Allow sub-bank creation only when current depth < maxDepth
                // This means:
                // - At depth 1 and 2: can create sub-banks (will become depth 2 and 3)
                // - At depth 3: cannot create sub-banks (would become depth 4, exceeding max)
                // - At depth 3: can still create exams
                
                // Force level 2 to always allow sub-bank creation
                // This fixes the issue where only one sub-bank can be created at level 2
                const isAtLevel2 = calculatedDepth === 2;
                const canCreateMoreSubBanks = isAtLevel2 ? true : calculatedDepth < maxDepth;
                
                console.log('Setting depth validation in loadSubBanks:', {
                    currentBankId,
                    breadcrumbsLength: breadcrumbs.length,
                    calculatedDepth,
                    maxDepth,
                    canCreateMoreSubBanks,
                    isAtLevel2,
                    breadcrumbs: breadcrumbs.map(b => b.name)
                });
                
                // Set the state based on local calculation first
                setCurrentDepth(calculatedDepth);
                setCanCreateSubBank(canCreateMoreSubBanks);
                
                if (!canCreateMoreSubBanks && calculatedDepth === maxDepth) {
                    setDepthValidationReason(`Maximum folder depth of ${maxDepth} levels reached. You can still create exams here.`);
                } else if (!canCreateMoreSubBanks) {
                    setDepthValidationReason(`Maximum folder depth exceeded`);
                } else {
                    setDepthValidationReason(undefined);
                }
                
                // Optional: Validate with backend API but don't override local logic unless there's a real error
                // This prevents API inconsistencies from affecting the UI
                try {
                    const subBankPath = breadcrumbs.slice(1).map(b => b.id); // Convert breadcrumbs to path
                    await validateSubBankCreation(currentBankId, subBankPath);
                } catch (error) {
                    console.warn('Backend validation failed, using local calculation:', error);
                    // Keep local calculation
                }
            }
        };

        loadSubBanks();
    }, [currentBankId, breadcrumbs, maxDepth]);

    // Note: Depth validation is now handled in the loadSubBanks useEffect above to avoid conflicts

    // Helper function to recursively process sub-banks at all nesting levels
    // Defined outside of the fetch functions so it can be reused
    const processSubBanksRecursively = (banks: any[]): any[] => {
        if (!banks || !Array.isArray(banks) || banks.length === 0) {
            return [];
        }
        
        return banks.map((bank: any) => ({
            _id: bank._id,
            bank_name: bank.name || bank.bank_name,
            exam_ids: bank.exam_ids || [],
            // Recursively process any nested sub-banks
            sub_banks: processSubBanksRecursively(bank.sub_banks || [])
        }));
    };
    
    const fetchSubBanks = async (subBankId: string) => {
        try {
            setIsLoadingSubBanks(true);
            setIsLoadingExams(true);

            console.log('Fetching sub-banks for bank ID:', subBankId);
            
            // Using the correct API endpoint based on the bank.route.ts backend route
            // The endpoint for getting bank hierarchy is: GET /bank/bank-:id/hierarchy
            const response = await clientAPI.get(`bank/bank-${subBankId}/hierarchy`);

            console.log('Response data:', response.data);

            if (!response.data || !response.data.data) {
                throw new Error("Failed to fetch sub-banks");
            }

            const bankData = response.data.data;
            console.log('Received bank hierarchy data:', bankData);

            // Check if the current bank has examinations and fetch them
            if (bankData.exam_ids && bankData.exam_ids.length > 0) {
                fetchExaminations(bankData.exam_ids);
            } else {
                setCurrentExams([]);
                setIsLoadingExams(false);
            }

            // Map sub-banks to the correct format for display
            // Sub-banks use 'name' field while parent banks use 'bank_name'
            const subBanks = bankData.sub_banks || [];
            console.log('Number of direct sub-banks:', subBanks.length);
            
            if (subBanks.length > 0) {
                console.log('First sub-bank details:', subBanks[0]);
                for (let i = 0; i < subBanks.length; i++) {
                    if (subBanks[i].sub_banks && subBanks[i].sub_banks.length > 0) {
                        console.log(`Sub-bank ${i} (${subBanks[i].name}) has ${subBanks[i].sub_banks.length} nested sub-banks:`, 
                        subBanks[i].sub_banks.map((sb: { name?: string; bank_name?: string }) => sb.name || sb.bank_name || 'Unknown'));
                    }
                }
            }
            
            // Recursively process all sub-banks to ensure proper rendering
            const processedSubBanks = processSubBanksRecursively(subBanks);
            
            console.log('Processed sub-banks:', processedSubBanks);
            return processedSubBanks;
        } catch (error) {
            console.error("Error fetching sub-banks:", error);
            errorHandler(error);
            setCurrentExams([]);
            return [];
        } finally {
            setIsLoadingSubBanks(false);
        }
    };

    // Fetch examination details for a set of exam IDs
    const fetchExaminations = async (examIds: string[]) => {
        if (!examIds || examIds.length === 0) {
            setCurrentExams([]);
            setIsLoadingExams(false);
            return;
        }

        try {
            // Fetch each examination by ID
            const examPromises = examIds.map(examId =>
                clientAPI.get(`exam/${examId}`)
                    .then(res => res.data && res.data.data ? res.data.data : null)
                    .catch(err => {
                        console.error(`Error fetching exam ${examId}:`, err);
                        return null;
                    })
            );

            const exams = await Promise.all(examPromises);
            // Filter out any failed requests
            setCurrentExams(exams.filter(exam => exam !== null));
        } catch (error) {
            console.error("Error fetching examinations:", error);
            errorHandler(error);
            setCurrentExams([]);
        } finally {
            setIsLoadingExams(false);
        }
    };

    // Handle bank delete
    const handleBankDelete = async (bankId: string) => {
        if (!confirm("Are you sure you want to delete this bank? This action cannot be undone.")) {
            return;
        }

        try {
            if (currentBankId) {
                // It's a sub-bank - we need to find the path to this sub-bank
                // First, get the current bank hierarchy
                const response = await clientAPI.get(`bank/bank-${currentBankId}/hierarchy`);
                if (!response.data || !response.data.data) {
                    throw new Error("Failed to fetch bank hierarchy");
                }

                const bank = response.data.data;

                // Find the sub-bank in the hierarchy and its path
                let subBankPath: string[] = [];
                const findSubBankPath = (subBanks: any[], path: string[] = []): boolean => {
                    for (let i = 0; i < subBanks.length; i++) {
                        const subBank = subBanks[i];
                        if (subBank._id === bankId) {
                            subBankPath = [...path];
                            return true;
                        }
                        if (subBank.sub_banks && subBank.sub_banks.length > 0) {
                            if (findSubBankPath(subBank.sub_banks, [...path, subBank._id])) {
                                return true;
                            }
                        }
                    }
                    return false;
                };

                if (bank.sub_banks && findSubBankPath(bank.sub_banks)) {
                    // We found the path to the sub-bank
                    // The API expects the path as a comma-separated string of sub-bank IDs
                    const pathString = subBankPath.join(',');

                    if (pathString) {
                        // If there's a path, it means the sub-bank is nested inside other sub-banks
                        // Using the updated route structure to avoid parameter conflicts
                        await clientAPI.delete(`bank/bank-${currentBankId}/sub-bank-nested/${pathString}/${bankId}`);
                    } else {
                        // If there's no path, it means the sub-bank is directly under the current bank
                        await clientAPI.delete(`bank/bank-${currentBankId}/sub-bank/${bankId}`);
                    }
                } else {
                    // Fallback to direct sub-bank delete if path not found
                    await clientAPI.delete(`bank/bank-${currentBankId}/sub-bank/${bankId}`);
                }
            } else {
                // It's a root bank
                await clientAPI.delete(`bank/bank-${bankId}`);
            }

            // Remove from local state
            setCurrentBanks(banks => banks.filter(bank => bank._id !== bankId));

            toast.success("Bank deleted successfully");
        } catch (error) {
            console.error("Error deleting bank:", error);
            errorHandler(error);
        }
    };

    // Update breadcrumb by reconstructing the navigation path
    const updateBreadcrumbName = (bankId: string, newName: string) => {
        // Find the index of the renamed bank in the breadcrumbs
        const bankIndex = breadcrumbs.findIndex(crumb => crumb.id === bankId);

        if (bankIndex !== -1) {
            // Navigate to the parent of the renamed bank
            const parentIndex = bankIndex - 1;
            navigateToBreadcrumbInStore(parentIndex);

            // Then navigate to the renamed bank with its new name
            navigateTo(bankId, newName);
        }
    };

    const handleBankDoubleClick = async (bank: Bank) => {
        if (!bank._id) return;

        console.log('Double-clicked bank:', bank);
        console.log('Bank has sub-banks:', bank.sub_banks ? bank.sub_banks.length : 0);

        // Using the bank navigation store for persistent navigation state
        navigateTo(bank._id, bank.bank_name);
        if (bank.sub_banks && bank.sub_banks.length > 0) {
            console.log('Using pre-loaded sub-banks:', bank.sub_banks);
            
            // Debug the nested structure
            if (bank.sub_banks.length > 0) {
                bank.sub_banks.forEach((subBank: any, idx: number) => {
                    console.log(`Pre-loaded sub-bank ${idx} (${subBank.name || subBank.bank_name})`);
                    if (subBank.sub_banks && subBank.sub_banks.length > 0) {
                        console.log(` - Has ${subBank.sub_banks.length} nested sub-banks`);
                    }
                });
            }
            
            // Process all sub-banks recursively
            const processedSubBanks = processSubBanksRecursively(bank.sub_banks);
            
            console.log('Processed sub-banks to display:', processedSubBanks);
            setCurrentBanks(processedSubBanks);
            setIsLoadingSubBanks(false);
        } else {
            // Need to fetch from API
            console.log('Fetching sub-banks from API for:', bank._id);
            const subBanks = await fetchSubBanks(bank._id);
            setCurrentBanks(subBanks);
        }
        
        // Also check if this bank has exams to display
        if (bank.exam_ids && bank.exam_ids.length > 0) {
            await fetchExaminations(bank.exam_ids);
        } else {
            setCurrentExams([]);
            setIsLoadingExams(false);
        }
    };

    // Handle bank rename - simplified version
    const handleBankRename = async (bankId: string, newName: string) => {
        if (!newName.trim()) {
            toast.error("Bank name cannot be empty");
            return;
        }

        try {
            if (currentBankId) {
                // It's a sub-bank - use the new simple API
                // Get the root bank ID from breadcrumbs or use currentBankId
                const rootBankId = breadcrumbs.length > 0 ? breadcrumbs[0].id : currentBankId;
                
                await clientAPI.put(`bank/bank-${rootBankId}/rename/${rootBankId}/${bankId}`, {
                    name: newName
                });
            } else {
                // It's a root bank
                await clientAPI.put(`bank/bank-${bankId}`, {
                    bank_name: newName
                });
            }

            // Update the local state
            setCurrentBanks(banks =>
                banks.map(bank =>
                    bank._id === bankId ? { ...bank, bank_name: newName } : bank
                )
            );

            // Update breadcrumb if the renamed bank is in the breadcrumb trail
            if (breadcrumbs.some(crumb => crumb.id === bankId)) {
                updateBreadcrumbName(bankId, newName);
            }

            toast.success("Bank renamed successfully");
        } catch (error) {
            console.error("Error renaming bank:", error);
            errorHandler(error);
            toast.error("Failed to rename bank");
        }
    };

    const handleCreateBank = async (bankName: string) => {
        try {
            setIsCreatingBank(true);
            console.log('Creating bank with name:', bankName, 'parent ID:', newBankParentId);
            console.log('Current breadcrumbs:', breadcrumbs);
            console.log('Current bank ID:', currentBankId);
    
            // If no parent ID and no current bank ID, create a root bank
            if (!newBankParentId && !currentBankId) {
                console.log('Creating root bank');
                const response = await clientAPI.post('bank', {
                    bank_name: bankName,
                    exam_ids: examId ? [examId] : []
                });
                console.log('Root bank created:', response.data);
            }
            // If we have a current bank ID, create a sub-bank under it
            else if (currentBankId) {
                // If we have breadcrumbs, we're in a nested context
                if (breadcrumbs.length > 0) {
                    console.log('Creating sub-bank in nested context using breadcrumbs');
                    
                    // The bank ID is the first breadcrumb (root bank)
                    const rootBankId = breadcrumbs[0].id;
                    
                    // If we have more than one breadcrumb, we need to create a sub-bank in a nested path
                    if (breadcrumbs.length > 1) {
                        // Last breadcrumb ID is our current position/parent for the new sub-bank
                        const currentSubBankId = breadcrumbs[breadcrumbs.length - 1].id;
                        
                        console.log('Creating nested sub-bank using new API:', {
                            rootBankId,
                            currentSubBankId,
                            bankName
                        });
                        
                        // Use the new nested sub-bank endpoint
                        const response = await clientAPI.post(
                            `bank/bank-${rootBankId}/sub-bank/nested/${currentSubBankId}`,
                            { name: bankName, exam_ids: examId ? [examId] : [] }
                        );
                        console.log('Nested sub-bank created:', response.data);
                    } else {
                        // Single breadcrumb, create direct sub-bank under the root bank
                        console.log('Creating direct sub-bank under root bank');
                        const response = await clientAPI.post(
                            `bank/bank-${rootBankId}/sub-bank/direct`,
                            { name: bankName, exam_ids: examId ? [examId] : [] }
                        );
                        console.log('Direct sub-bank created:', response.data);
                    }
                } else {
                    // No breadcrumbs but we have currentBankId, create direct sub-bank
                    console.log('Creating direct sub-bank under current bank');
                    const response = await clientAPI.post(
                        `bank/bank-${currentBankId}/sub-bank/direct`,
                        { name: bankName, exam_ids: examId ? [examId] : [] }
                    );
                    console.log('Direct sub-bank created:', response.data);
                }
            } 
            // If we have a parent ID, create a sub-bank under that parent
            else if (newBankParentId) {
                // If we're here, we're creating a sub-bank inside another sub-bank
                console.log('Creating nested sub-bank with parent ID:', newBankParentId);

                // Check if the parent is the current bank
                if (newBankParentId === currentBankId) {
                    // Create a direct sub-bank under the current bank
                    console.log('Creating direct sub-bank under current bank');
                    const response = await clientAPI.post(
                        `bank/bank-${currentBankId}/sub-bank/direct`,
                        { name: bankName, exam_ids: examId ? [examId] : [] }
                    );
                    console.log('Direct sub-bank created:', response.data);
                } else {
                    // We need to find the path to the parent sub-bank
                    const bankResponse = await clientAPI.get(`bank/bank-${currentBankId}/hierarchy`);
                    if (!bankResponse.data || !bankResponse.data.data) {
                        throw new Error('Failed to fetch bank hierarchy');
                    }

                    const bank = bankResponse.data.data;

                    // Find the path to the parent sub-bank
                    const findPath = (subBanks: any[], targetId: string, currentPath: string[] = []): string[] | null => {
                        if (!subBanks || subBanks.length === 0) return null;

                        for (const subBank of subBanks) {
                            // Check if this is the target sub-bank
                            if (subBank._id === targetId) {
                                return currentPath; // Return path to parent (not including the parent itself)
                            }

                            // Check nested sub-banks if they exist
                            if (subBank.sub_banks && subBank.sub_banks.length > 0) {
                                const nestedPath = [...currentPath, subBank._id];
                                const result = findPath(subBank.sub_banks, targetId, nestedPath);
                                if (result) return result;
                            }
                        }
                        return null;
                    };

                    const path = findPath(bank.sub_banks || [], newBankParentId);
                    console.log('Found path to parent sub-bank:', path);

                    // Create path based on if we found a valid path to the parent
                    if (path !== null) {
                        // Construct the path - we need to determine if the parent is a direct child or nested
                        if (path.length === 0) {
                            // Parent is directly under the current bank - use direct sub-bank endpoint
                            console.log('Parent is direct child of current bank, using direct sub-bank creation');
                            const response = await clientAPI.post(
                                `bank/bank-${currentBankId}/sub-bank/nested/${newBankParentId}`,
                                { name: bankName, exam_ids: examId ? [examId] : [] }
                            );
                            console.log('Nested sub-bank created:', response.data);
                        } else {
                            // Parent is nested - include parent in the path for correct placement
                            const fullPath = [...path, newBankParentId as string];
                            const pathString = fullPath.join(',');

                            // Creating a sub-bank inside a nested sub-bank - use the last parent ID
                            const parentSubBankId = newBankParentId as string;
                            console.log('Creating nested sub-bank with parent sub-bank ID:', parentSubBankId);
                            const url = `bank/bank-${currentBankId}/sub-bank/nested/${parentSubBankId}`;
                            const body = { name: bankName, exam_ids: examId ? [examId] : [] };
                            console.log('API request:', { url, body });

                            const response = await clientAPI.post(url, body);
                            console.log('API response:', response.data);
                        }
                    } else {
                        // Fallback: create a direct sub-bank under the current bank
                        console.log('Path not found, creating direct sub-bank fallback');
                        const response = await clientAPI.post(
                            `bank/bank-${currentBankId}/sub-bank/direct`,
                            { name: bankName, exam_ids: examId ? [examId] : [] }
                        );
                        console.log('Fallback direct sub-bank created:', response.data);
                    }
                }
            }
            
            // Refresh the view after creating the sub-bank
            if (breadcrumbs.length > 0) {
                console.log('Refreshing with breadcrumbs context');
                if (breadcrumbs.length > 1) {
                    // We're in a nested context, need to refresh sub-banks from the last breadcrumb
                    const currentBreadcrumb = breadcrumbs[breadcrumbs.length - 1];
                    console.log('Refreshing sub-banks using breadcrumb:', currentBreadcrumb);
                    
                    // Force re-fetch the sub-banks at the current path
                    const lastBreadcrumbId = currentBreadcrumb.id;
                    const updatedSubBanks = await fetchSubBanks(lastBreadcrumbId);
                    console.log('Updated sub-banks from breadcrumb refresh:', updatedSubBanks);
                    setCurrentBanks(updatedSubBanks);
                } else {
                    // Only one breadcrumb, we're at the root bank level
                    const rootBankId = breadcrumbs[0].id;
                    const updatedSubBanks = await fetchSubBanks(rootBankId);
                    console.log('Updated sub-banks from root bank refresh:', updatedSubBanks);
                    setCurrentBanks(updatedSubBanks);
                }
            } else if (currentBankId) {
                // We need a full refresh of the sub-bank structure to see nested changes
                console.log('Refreshing sub-banks using current bank ID');
                const updatedSubBanks = await fetchSubBanks(currentBankId);
                console.log('Updated sub-banks from current bank refresh:', updatedSubBanks);
                setCurrentBanks(updatedSubBanks);
            } else {
                // For root banks, refresh from the data fetched by useFetch
                console.log('Refreshing with data from useFetch');
                if (data && data.data) {
                    setCurrentBanks(data.data as unknown as Bank[]);
                }
            }

            // Close the modal
            setIsCreateModalOpen(false);

            // Show success message
            toast.success(newBankParentId ? "Sub-bank created successfully" : "Bank created successfully");

            // Reset parent ID after successful creation
            setNewBankParentId(null);
        } catch (error) {
            console.error("Error creating bank:", error);
            errorHandler(error);
        } finally {
            setIsCreatingBank(false);
            setNewBankParentId(null); // Reset the parent ID
        }
    };

    // Listen for createSubBank custom event
    useEffect(() => {
        const handleCreateSubBank = (event: CustomEvent) => {
            const { parentId } = event.detail;
            setNewBankParentId(parentId);
            setIsCreateModalOpen(true); // Open the modal instead of directly creating
        };

        window.addEventListener('createSubBank', handleCreateSubBank as EventListener);

        return () => {
            window.removeEventListener('createSubBank', handleCreateSubBank as EventListener);
        };
    }, []);

    const navigateToTopLevel = () => {
        console.log('Navigating to top level banks');
        navigateToRoot();
        setCurrentBanks([]);
        fetchTopLevelBanks();
    };

    const fetchTopLevelBanks = async () => {
        // Fetch top-level banks (direct API call)
        try {
            setIsLoadingSubBanks(true);
            console.log('Fetching top-level banks...');
            
            const response = await clientAPI.get(examId ? `bank/by-exam/${examId}` : `bank`);
            
            if (!response.data || !response.data.data) {
                console.error('Invalid response format when fetching top-level banks');
                setIsLoadingSubBanks(false);
                return [];
            }
            
            const banks = response.data.data;
            console.log('Top-level banks:', banks);
            
            setCurrentBanks(banks);
            setIsLoadingSubBanks(false);
            setCurrentExams([]);
            
            // Clear current bank selection
            setCurrentBank(null);
            
            return banks;
        } catch (error) {
            console.error('Error fetching top-level banks:', error);
            errorHandler(error);
            setIsLoadingSubBanks(false);
            return [];
        }
    };

    if (isLoading) {
        return (
            <div className="size-full flex gap-4 justify-center items-center">
                <SolarRefreshLineDuotone className="text-secondary animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="size-full flex gap-4 justify-center items-center">
                <Alert color="danger" title={error.toString()} />
            </div>
        );
    }

    if (!data || data.data.length === 0) {
        return (
            <div className="size-full flex flex-col gap-4 justify-center items-center">
                <h1 className="font-semibold">No Question Banks Found</h1>
            {examId && (
                <Link href={`/create/bank?examId=${examId}`}>
                    <Button color="primary" variant="flat">
                        Create Question Bank
                    </Button>
                </Link>
            )}
        </div>
    );
}

// Show search results message
if (searchQuery.trim() && filteredBanks.length === 0 && filteredExams.length === 0) {
    return (
        <div className="size-full flex flex-col gap-4 justify-center items-center">
            <h1 className="font-semibold">No banks or exams found</h1>
            <p className="text-sm text-gray-500">Try adjusting your search terms</p>
        </div>
    );
}

return (
    <div className="w-full p-4">
        {/* Breadcrumb navigation - always show root */}
        <div className="flex items-center mb-4 text-sm">
            <button
                onClick={() => navigateToRoot()}
                className={`${breadcrumbs.length === 0 ? "text-secondary font-medium" : "text-secondary hover:underline"}`}
            >
                Root
            </button>
            {breadcrumbs.map((crumb, idx) => (
                <div key={crumb.id} className="flex items-center">
                    <span className="mx-2 text-gray-500">/</span>
                    <button
                        onClick={() => navigateToBreadcrumbInStore(idx)}
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

        {/* Depth Level Indicator */}
        <div className="flex items-center justify-between mb-4 p-2 rounded-lg bg-zinc-800 border border-zinc-700">
            <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-300">Folder Depth:</span>
                <div className="flex items-center gap-1">
                    {[...Array(maxDepth)].map((_, i) => {
                        const isActive = i < breadcrumbs.length;
                        const isAtMax = i === maxDepth - 1 && breadcrumbs.length >= maxDepth;
                        return (
                            <div
                                key={i}
                                className={`w-3 h-3 rounded-full border-2 ${
                                    isActive
                                        ? isAtMax
                                            ? 'bg-red-500 border-red-600'
                                            : i === maxDepth - 2 && breadcrumbs.length === maxDepth - 1
                                            ? 'bg-amber-500 border-amber-600'
                                            : 'bg-blue-500 border-blue-600'
                                        : 'bg-zinc-600 border-zinc-700'
                                }`}
                                title={`Level ${i + 1}${isActive ? ' (current)' : ''}`}
                            />
                        );
                    })}
                </div>
                <span className="text-xs text-gray-400">
                    {breadcrumbs.length}/{maxDepth}
                </span>
            </div>
            
        </div>

        <div className="flex justify-between items-center mb-4">
            <div>
                {examId && (
                    <Link href={`/create/bank?examId=${examId}`}>
                        <Button color="primary" size="sm">
                            Create Bank
                        </Button>
                    </Link>
                )}
            </div>
        </div>

        {isLoadingSubBanks ? (
            <div className="p-12 flex justify-center items-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-secondary"></div>
                    <p className="text-gray-500">Loading folder contents...</p>
                </div>
            </div>
        ) : (filteredBanks.length > 0 || filteredExams.length > 0) ? (
            <div className="flex flex-wrap justify-start gap-4">
                {/* Display all the bank cards */}
                {filteredBanks.map((bank, idx) => {
                    // Log each bank to debug what's being rendered
                    console.log(`Rendering bank ${idx}:`, bank.bank_name, 'with sub-banks:', 
                        bank.sub_banks ? bank.sub_banks.length : 0);
                    
                    return (
                        <BankCard
                            id={bank._id}
                            className="w-[150px]"
                            key={`bank-${idx}`}
                            title={bank.bank_name}
                            examId={bank.exam_id}
                            exam_ids={bank.exam_ids}
                            subBanks={bank.sub_banks}
                            onDoubleClick={() => handleBankDoubleClick(bank)}
                            onRename={handleBankRename}
                            onDelete={handleBankDelete}
                        />
                    );
                })}
                {/* Display all examination cards */}
                {isLoadingExams ? (
                    <div className="w-[222px] h-32 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-secondary"></div>
                    </div>
                ) : (
                    filteredExams.map((exam, idx) => (
                        <ExamCard
                            key={`exam-${idx}`}
                            id={exam._id}
                            title={exam.title || 'Untitled Examination'}
                            description={exam.description || ''}
                            className="w-[150px]"
                        />
                    ))
                )}
                {/* Add folder button at the end of the list */}
                {currentBankId && (
                    <div className="w-[150px]">
                        <div
                            className={`flex flex-col items-center w-full relative cursor-pointer transition-colors p-4 rounded-lg border-2 border-dashed ${
                                !canCreateSubBank && currentDepth === maxDepth
                                    ? 'bg-amber-900/20 border-amber-600/40 hover:bg-amber-900/30 hover:border-amber-600/60'
                                    : !canCreateSubBank
                                    ? 'bg-red-900/30 border-red-700/50 hover:bg-red-900/40 hover:border-red-700/70'
                                    : 'bg-zinc-800 border-zinc-700 hover:bg-zinc-700 hover:border-zinc-600'
                            }`}
                            onClick={() => {
                                // If at max depth, open exam form directly
                                if (!canCreateSubBank) {
                                    try {
                                        // Determine the bank context (bank or sub-bank ID)
                                        let bankContext: string;
                                        let subBankIds: string[] = [];

                                        // We're always in some bank context
                                        if (breadcrumbs.length > 0) {
                                            // We're in a sub-bank
                                            // The first breadcrumb is the root bank ID
                                            bankContext = breadcrumbs[0].id;
                                            
                                            // If we have more breadcrumbs, they form the sub-bank path
                                            if (breadcrumbs.length > 1) {
                                                // Get all breadcrumb IDs to form the complete path
                                                subBankIds = breadcrumbs.map(crumb => crumb.id);
                                            }
                                        } else if (currentBankId) {
                                            // We're at the root level with a selected bank
                                            bankContext = currentBankId;
                                            // Since we're directly in this bank, add it to the path
                                            subBankIds = [currentBankId];
                                        } else {
                                            // Fallback - we should always have either breadcrumbs or currentBankId
                                            console.error('No bank context found!');
                                            bankContext = '';
                                        }
                                        
                                        // Store the bank context for examination creation
                                        setExamBankContext({
                                            bankId: bankContext,
                                            subBankPath: subBankIds.length > 0 ? subBankIds : undefined
                                        });

                                        // Open the examination modal directly
                                        setIsExamModalOpen(true);
                                    } catch (error) {
                                        console.error("Error opening examination form:", error);
                                        errorHandler(error);
                                    }
                                } else {
                                    // Normal flow - open create modal
                                    // Set parent ID based on navigation context
                                    if (breadcrumbs.length > 0) {
                                        // If we're inside a sub-bank, use the last breadcrumb as parent ID
                                        const currentBreadcrumb = breadcrumbs[breadcrumbs.length - 1];
                                        setNewBankParentId(currentBreadcrumb.id);
                                    } else {
                                        // If at root level of bank, create direct sub-bank
                                        setNewBankParentId(null);
                                    }

                                    // Open the create modal
                                    setIsCreateModalOpen(true);
                                }
                            }}
                        >
                            <div className={`mb-2 ${
                                !canCreateSubBank && currentDepth === maxDepth
                                    ? 'text-amber-500' 
                                    : !canCreateSubBank 
                                    ? 'text-red-600' 
                                    : 'text-gray-600'
                            }`}>
                                {!canCreateSubBank ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                        <polyline points="14,2 14,8 20,8"/>
                                        <line x1="16" y1="13" x2="8" y2="13"/>
                                        <line x1="16" y1="17" x2="8" y2="17"/>
                                        <polyline points="10,9 9,9 8,9"/>
                                    </svg>
                                ) : (
                                    <BankAdd width={80}/>
                                )}
                            </div>
                            
                            <div className="flex flex-col items-center text-center">
                                <p className={`text-sm font-medium truncate w-fit ${
                                    !canCreateSubBank && currentDepth === maxDepth
                                        ? 'text-amber-300'
                                        : !canCreateSubBank 
                                        ? 'text-red-400' 
                                        : 'text-gray-300'
                                }`}>
                                    {!canCreateSubBank ? 'Create Exam' : 'Add New'}
                                </p>
                                <div className="mt-1">
                                    {!canCreateSubBank && currentDepth === maxDepth ? (
                                        <p className="text-xs text-amber-400 font-medium">
                                            📝 Max folder depth - Exams only
                                        </p>
                                    ) : !canCreateSubBank ? (
                                        <p className="text-xs text-red-400 font-medium">
                                            🚫 Max depth reached
                                        </p>
                                    ) : (
                                        <p className="text-xs text-gray-400">
                                            Folder or exam
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        ) : (
            <div className="flex flex-col items-center justify-center p-12">
                <div className="text-gray-300 text-center">
                    <p className="text-lg font-medium mb-2">No folders or exams found</p>
                    <p className="text-sm text-gray-400">Create your first folder or exam to get started</p>
                </div>
                {currentBankId && (
                    <div
                        className={`mt-6 flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg transition-colors cursor-pointer min-h-[200px] ${
                            !canCreateSubBank && currentDepth === maxDepth
                                ? 'bg-amber-900/20 border-amber-600/40 hover:bg-amber-900/30 hover:border-amber-600/60'
                                : !canCreateSubBank
                                ? 'bg-red-900/30 border-red-700/50 hover:bg-red-900/40 hover:border-red-700/70'
                                : 'bg-zinc-800 border-zinc-700 hover:bg-zinc-700 hover:border-zinc-600'
                        }`}
                        onClick={async () => {
                            // First, validate if sub-bank creation is allowed at current depth
                            const subBankPath = breadcrumbs.map(crumb => crumb.name);
                            const canCreate = await validateSubBankCreation(currentBankId || '', subBankPath);
                            
                            if (!canCreate) {
                                // Maximum depth reached - open exam modal directly
                                try {
                                    // Determine the correct bank context for examination creation
                                    let bankContext = '';
                                    let subBankIds: string[] = [];
                                    
                                    if (breadcrumbs.length > 0) {
                                        // We're inside a sub-bank structure
                                        bankContext = breadcrumbs[0].id; // Root bank ID
                                        // Use breadcrumbs to build the full path
                                        if (breadcrumbs.length > 1) {
                                            // Get all breadcrumb IDs to form the complete path
                                            subBankIds = breadcrumbs.map(crumb => crumb.id);
                                        }
                                    } else if (currentBankId) {
                                        // We're at the root level with a selected bank
                                        bankContext = currentBankId;
                                        // Since we're directly in this bank, add it to the path
                                        subBankIds = [currentBankId];
                                    } else {
                                        // Fallback - we should always have either breadcrumbs or currentBankId
                                        console.error('No bank context found!');
                                        bankContext = '';
                                    }
                                    
                                    // Store the bank context for examination creation
                                    setExamBankContext({
                                        bankId: bankContext,
                                        subBankPath: subBankIds.length > 0 ? subBankIds : undefined
                                    });

                                    // Open the examination modal directly
                                    setIsExamModalOpen(true);
                                } catch (error) {
                                    console.error("Error opening examination form:", error);
                                    errorHandler(error);
                                }
                            } else {
                                // Normal flow - open create modal
                                setIsCreateModalOpen(true);
                            }
                        }}
                    >
                        <div className={`mb-2 ${
                            !canCreateSubBank && currentDepth === maxDepth
                                ? 'text-amber-500'
                                : !canCreateSubBank 
                                ? 'text-red-600' 
                                : breadcrumbs.length >= maxDepth - 1 
                                ? 'text-amber-600' 
                                : 'text-gray-600'
                        }`}>
                            {!canCreateSubBank ? (
                                <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                    <polyline points="14,2 14,8 20,8"/>
                                    <line x1="16" y1="13" x2="8" y2="13"/>
                                    <line x1="16" y1="17" x2="8" y2="17"/>
                                    <polyline points="10,9 9,9 8,9"/>
                                </svg>
                            ) : (
                                <BankAdd width={100}/>
                            )}
                        </div>
                        <div className="pt-2">
                            <p className={`text-center font-medium ${
                                !canCreateSubBank && currentDepth === maxDepth
                                    ? 'text-amber-300'
                                    : !canCreateSubBank 
                                    ? 'text-red-400' 
                                    : 'text-gray-200'
                            }`}>
                                {!canCreateSubBank ? 'Create Exam' : 'Add New'}
                            </p>
                            <div className="mt-1 text-center">
                                {!canCreateSubBank && currentDepth === maxDepth ? (
                                    <p className="text-xs text-amber-400 font-medium">
                                        📝 Max folder depth - Create exams here
                                    </p>
                                ) : !canCreateSubBank ? (
                                    <p className="text-xs text-red-400 font-medium">
                                        🚫 Max folder depth reached
                                    </p>
                                ) : (
                                    <p className="text-xs text-gray-400">
                                        Create folder or exam
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        )}

            {/* Create Bank/Sub-Bank Modal */}
            <Modal
                isOpen={isCreateModalOpen}
                onClose={() => {
                    setIsCreateModalOpen(false);
                }}
                placement="center"
            >
                <ModalContent>
                    <ModalHeader className="flex flex-col gap-1">
                        {!canCreateSubBank ? "Create Exam (Max folder depth reached)" : 
                         currentBankId ? "Create in this folder" : "Create new item"}
                    </ModalHeader>
                    <ModalBody>
                        <div className="flex flex-col gap-4">
                            {canCreateSubBank && (
                                <Button
                                    color="secondary"
                                    size="lg"
                                    className="h-12"
                                    startContent={
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"></path>
                                        </svg>
                                    }
                                    onPress={() => {
                                        setIsCreatingBank(true);
                                        handleCreateBank("New Bank");
                                        setIsCreateModalOpen(false);
                                    }}
                                >
                                    Create New Bank
                                </Button>
                            )}
                            
                            {!canCreateSubBank && (
                                <Alert color="warning" className="text-sm">
                                    <div className="flex flex-col gap-1">
                                        <p className="font-medium">Maximum folder depth reached ({currentDepth}/{maxDepth})</p>
                                        <p className="text-xs">You can still create exams at this level, but no more sub-folders.</p>
                                    </div>
                                </Alert>
                            )}

                            <Button
                                color="secondary"
                                size="lg"
                                className="h-12"
                                startContent={
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
                                        <polyline points="14 2 14 8 20 8"></polyline>
                                    </svg>
                                }
                                onPress={() => {
                                    // Open examination form modal with proper context
                                    try {
                                        // Determine the bank context (bank or sub-bank ID)
                                        let bankContext: string;
                                        let subBankIds: string[] = [];

                                        // We're always in some bank context
                                        if (breadcrumbs.length > 0) {
                                            // We're in a sub-bank
                                            // The first breadcrumb is the root bank ID
                                            bankContext = breadcrumbs[0].id;
                                            
                                            // If we have more breadcrumbs, they form the sub-bank path
                                            if (breadcrumbs.length > 1) {
                                                // Get all breadcrumb IDs to form the complete path
                                                subBankIds = breadcrumbs.map(crumb => crumb.id);
                                            }
                                        } else if (currentBankId) {
                                            // We're at the root level with a selected bank
                                            bankContext = currentBankId;
                                            // Since we're directly in this bank, add it to the path
                                            subBankIds = [currentBankId];
                                        } else {
                                            // Fallback - we should always have either breadcrumbs or currentBankId
                                            console.error('No bank context found!');
                                            bankContext = '';
                                        }

                                        console.log('Setting exam bank context:', {
                                            bankContext,
                                            breadcrumbs: breadcrumbs.map(b => `${b.name} (${b.id})`),
                                            subBankIds
                                        });
                                        
                                        // Store the bank context for examination creation
                                        setExamBankContext({
                                            bankId: bankContext,
                                            subBankPath: subBankIds.length > 0 ? subBankIds : undefined
                                        });

                                        // Close the current modal and open the examination modal
                                        setIsCreateModalOpen(false);
                                        setIsExamModalOpen(true);
                                    } catch (error) {
                                        console.error("Error opening examination form:", error);
                                        errorHandler(error);
                                    }
                                }}
                            >
                                Create Examination
                            </Button>
                        </div>
                    </ModalBody>
                    <ModalFooter>
                        <Button color="danger" variant="light" onPress={() => setIsCreateModalOpen(false)}>
                            Cancel
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Examination creation modal */}
            <Modal
                isOpen={isExamModalOpen}
                onOpenChange={setIsExamModalOpen}
                placement="top-center"
            >
                <ModalContent>
                    {(onClose) => (
                        <form onSubmit={async (e) => {
                            try {
                                e.preventDefault();
                                const formData = new FormData(e.currentTarget);
                                const formEntries = Object.fromEntries(formData.entries());

                                // Create the examination with bank context
                                // The backend will handle adding the exam to the correct bank/sub-bank
                                const examRes = await clientAPI.post('exam', {
                                    title: formEntries.title,
                                    description: formEntries.description,
                                    bankId: examBankContext.bankId,
                                    subBankPath: examBankContext.subBankPath
                                });

                                const newExamId = examRes.data.data._id;
                                console.log('Examination created with ID:', newExamId);
                                
                                // Now add the exam to the correct sub-bank using the simple API
                                try {
                                    if (examBankContext.subBankPath && examBankContext.subBankPath.length > 0) {
                                        // We're in a sub-bank, use the simple API to add exam
                                        const rootBankId = breadcrumbs[0].id; // First breadcrumb is always the root bank
                                        const currentSubBankId = breadcrumbs[breadcrumbs.length - 1].id; // Last breadcrumb is current sub-bank
                                        
                                        console.log('Adding exam to sub-bank:', {
                                            rootBankId,
                                            currentSubBankId,
                                            examId: newExamId
                                        });
                                        
                                        await clientAPI.post(`bank/bank-${rootBankId}/add-exam/${rootBankId}/${currentSubBankId}/${newExamId}`);
                                        
                                        console.log('Exam successfully added to sub-bank');
                                    } else {
                                        // We're in a root bank, add exam to root bank
                                        console.log('Adding exam to root bank:', examBankContext.bankId);
                                        await clientAPI.post(`bank/bank-${examBankContext.bankId}/exam/${newExamId}`);
                                    }
                                } catch (bankError) {
                                    console.error('Error adding exam to bank:', bankError);
                                    toast.error('Exam created but failed to add to bank. Please try refreshing.');
                                }
                                
                                console.log('Exam created successfully with bank association:', {
                                    examId: newExamId,
                                    bankId: examBankContext.bankId,
                                    subBankPath: examBankContext.subBankPath
                                });
                                
                                // Refresh the view after creating the exam
                                setIsExamModalOpen(false);
                                
                                // Refresh the bank data
                                // If we have a current bank ID, refresh the sub-banks
                                if (currentBankId) {
                                    console.log('Refreshing sub-banks after exam creation for bank:', currentBankId);
                                    
                                    // If we're in a nested location (breadcrumbs has more than one entry),
                                    // we need to refresh the current location
                                    if (breadcrumbs.length > 1) {
                                        console.log('In nested location, refreshing the last breadcrumb bank');
                                        const currentLocationBankId = breadcrumbs[breadcrumbs.length - 1].id;
                                        const refreshedSubBanks = await fetchSubBanks(currentLocationBankId);
                                        setCurrentBanks(refreshedSubBanks);
                                    } else {
                                        // Just refresh the current bank's direct sub-banks
                                        const refreshedSubBanks = await fetchSubBanks(currentBankId);
                                        setCurrentBanks(refreshedSubBanks);
                                    }
                                } else {
                                    // Otherwise refresh the root banks
                                    console.log('Refreshing root banks');
                                    mutate();
                                }
                                toast.success('Examination created successfully');
                                onClose();
                            } catch (error) {
                                console.error('Error creating examination:', error);
                                errorHandler(error);
                            }
                        }}>
                            <ModalHeader><h1>Create New Examination</h1></ModalHeader>
                            <ModalBody>
                                <div className="flex flex-col gap-4">
                                    <Input 
                                        name="title" 
                                        label="Examination Title" 
                                        placeholder="Enter examination title" 
                                        isRequired 
                                        className="mb-2" 
                                    />
                                    <Textarea 
                                        name="description" 
                                        label="Description" 
                                        placeholder="Enter examination description"
                                        className="mb-2"
                                    />
                                    {/* Hidden fields for bank context */}
                                    <input type="hidden" name="bankId" value={examBankContext.bankId} />
                                    {examBankContext.subBankId && (
                                        <input type="hidden" name="subBankId" value={examBankContext.subBankId} />
                                    )}
                                </div>
                            </ModalBody>
                            <ModalFooter>
                                <Button color="danger" variant="light" onPress={onClose} type="button">
                                    Cancel
                                </Button>
                                <Button color="secondary" type="submit">
                                    Create Examination
                                </Button>
                            </ModalFooter>
                        </form>
                    )}
                </ModalContent>
            </Modal>
        </div>
    );
};

export default BankList;
