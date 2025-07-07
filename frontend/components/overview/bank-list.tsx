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
};

const BankList = ({ examId }: Props) => {
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

    useEffect(() => {
        // If we're at the root level and data is loaded, set the current banks
        if (data && data.data && !currentBankId) {
            setCurrentBanks(data.data as unknown as Bank[]);
            setCurrentExams([]);
        }
    }, [data, currentBankId]);

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
            }
        };

        loadSubBanks();
    }, [currentBankId, breadcrumbs.length]);

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

    // Handle bank rename
    const handleBankRename = async (bankId: string, newName: string) => {
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
                            subBankPath = [...path, subBank._id];
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
                    const pathString = subBankPath.slice(0, -1).join(','); // Remove the last ID which is the target bank itself

                    if (pathString) {
                        // If there's a path, it means the sub-bank is nested inside other sub-banks
                        // Using the updated route structure to avoid parameter conflicts
                        await clientAPI.put(`bank/bank-${currentBankId}/sub-bank-nested/${pathString}/${bankId}`, { name: newName });
                    } else {
                        // If there's no path, it means the sub-bank is directly under the current bank
                        await clientAPI.put(`bank/bank-${currentBankId}/sub-bank/${bankId}`, { name: newName });
                    }
                } else {
                    // Fallback to direct sub-bank update if path not found
                    await clientAPI.put(`bank/bank-${currentBankId}/sub-bank/${bankId}`, { name: newName });
                }
            } else {
                // It's a root bank
                await clientAPI.put(`bank/bank-${bankId}`, { bank_name: newName });
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
        } catch (error) {
            console.error("Error renaming bank:", error);
            errorHandler(error);
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
            // If we have a current bank ID but no parent ID, create a direct sub-bank under the current bank
            else if (!newBankParentId && currentBankId) {
                // If we have breadcrumbs, we're in a nested context
                if (breadcrumbs.length > 0) {
                    console.log('Creating sub-bank in nested context using breadcrumbs');
                    
                    // The bank ID is the first breadcrumb (root bank)
                    const rootBankId = breadcrumbs[0].id;
                    
                    // If we have more than one breadcrumb, we need to create a sub-bank in a nested path
                    if (breadcrumbs.length > 1) {
                        // Last breadcrumb ID is our current position/parent for the new sub-bank
                        const currentLocationId = breadcrumbs[breadcrumbs.length - 1].id;
                        const subBankPath = breadcrumbs.map(crumb => crumb.id);
                        
                        console.log('Creating nested sub-bank with path:', subBankPath, 'and parent:', currentLocationId);
                        
                        // Use the nested sub-bank endpoint with the full path
                        const pathString = subBankPath.join(',');
                        const response = await clientAPI.post(
                            `bank/bank-${rootBankId}/sub-bank-nested/${pathString}`,
                            { name: bankName, exam_ids: examId ? [examId] : [] }
                        );
                        console.log('Nested sub-bank created:', response.data);
                    } else {
                        // Single breadcrumb, create direct sub-bank under the root bank
                        console.log('Creating direct sub-bank under root bank');
                        const response = await clientAPI.post(
                            `bank/bank-${rootBankId}/sub-bank`,
                            { name: bankName, exam_ids: examId ? [examId] : [] }
                        );
                        console.log('Direct sub-bank created:', response.data);
                    }
                } else {
                    // No breadcrumbs but we have currentBankId, create direct sub-bank
                    console.log('Creating direct sub-bank under current bank');
                    const response = await clientAPI.post(
                        `bank/bank-${currentBankId}/sub-bank`,
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
                        `bank/bank-${currentBankId}/sub-bank`,
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
                                `bank/bank-${currentBankId}/sub-bank`,
                                { name: bankName, parent_id: newBankParentId as string, exam_ids: examId ? [examId] : [] }
                            );
                            console.log('Direct sub-bank created:', response.data);
                        } else {
                            // Parent is nested - include parent in the path for correct placement
                            const fullPath = [...path, newBankParentId as string];
                            const pathString = fullPath.join(',');

                            // Creating a sub-bank inside a nested sub-bank
                            console.log('Creating nested sub-bank with path:', pathString);
                            const url = `bank/bank-${currentBankId}/sub-bank-nested/${pathString}`;
                            const body = { name: bankName, exam_ids: examId ? [examId] : [] };
                            console.log('API request:', { url, body });

                            const response = await clientAPI.post(url, body);
                            console.log('API response:', response.data);
                        }
                    } else {
                        // Fallback: create a direct sub-bank under the current bank
                        console.log('Path not found, creating direct sub-bank with parent_id:', newBankParentId);
                        const response = await clientAPI.post(
                            `bank/bank-${currentBankId}/sub-bank`,
                            { name: bankName, parent_id: newBankParentId as string, exam_ids: examId ? [examId] : [] }
                        );
                        console.log('Fallback direct sub-bank created:', response.data);
                    }
                }
            }
            
            // Refresh the view after creating the sub-bank
            if (currentBankId) {
                // We need a full refresh of the sub-bank structure to see nested changes
                const updatedSubBanks = await fetchSubBanks(currentBankId);
                setCurrentBanks(updatedSubBanks);
            } else {
                // For root banks, refresh from the data fetched by useFetch
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
        ) : (currentBanks.length > 0 || currentExams.length > 0) ? (
            <div className="flex flex-wrap justify-start gap-4">
                {/* Display all the bank cards */}
                {currentBanks.map((bank, idx) => {
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
                    currentExams.map((exam, idx) => (
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
                                className="flex flex-col items-center w-full relative cursor-pointer animate-pulse transition-colors"
                                onClick={() => {
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
                                }}
                            >
                                <BankAdd width={100}/>
                                <div className="flex flex-col items-center pt-3">
                                    <p className="text-sm font-medium truncate w-full text-center">Add New</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="flex flex-col w-[150px]">
                    {currentBankId && (
                        <div
                            className="flex w-fit flex-col items-center cursor-pointer animate-pulse transition-colors"
                            onClick={() => setIsCreateModalOpen(true)}
                        >
                            <BankAdd width={100}/>
                            <div className="pt-2">
                                <p>Add New</p>
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
                        {currentBankId ? "Create in this folder" : "Create new item"}
                    </ModalHeader>
                    <ModalBody>
                        <div className="flex flex-col gap-4">
                            <Button
                                color="secondary"
                                size="lg"
                                className="h-12"
                                startContent={
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"></path>
                                    </svg>
                                }
                                onPress={async () => {
                                    try {
                                        setIsCreatingBank(true);

                                        // Use our improved handleCreateBank function with a default name
                                        await handleCreateBank("New Bank");

                                        // Close the modal after successful creation
                                        setIsCreateModalOpen(false);
                                    } catch (error) {
                                        console.error("Error creating bank:", error);
                                        errorHandler(error);
                                    } finally {
                                        setIsCreatingBank(false);
                                    }
                                }}
                            >
                                Create New Bank
                            </Button>

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
