"use client";

import React, { useEffect, useState } from "react";
import BankCard from "../bank/bank-card";
import { useFetch } from "@/hooks/use-fetch";
import { useUserStore } from "@/stores/user.store";
import { useBankNavigation, BankBreadcrumb } from "@/stores/bank-selector.store";
import { BankAdd, SolarRefreshLineDuotone } from "../icons/icons";
import { Alert, Button, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@nextui-org/react";
import { BankResponse } from "@/types/bank";
import Link from "next/link";
import { clientAPI } from "@/config/axios.config";
import { errorHandler } from "@/utils/error";
import { toast } from "react-toastify";

// Define a type that matches both our needs and the API response
type Bank = {
    _id: string;
    bank_name: string;
    exam_id?: string;
    sub_banks?: any[];
};

type BreadcrumbItem = BankBreadcrumb;

type Props = {
    examId?: string;
};

const BankList = ({ examId }: Props) => {
    const { user } = useUserStore();
    const { data, error, isLoading, mutate } = useFetch<ServerResponse<BankResponse[]>>(
        examId ? `bank/by-exam/${examId}` : user ? `user/bank/${user._id}` : `bank`
    );

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
    const [isCreatingExam, setIsCreatingExam] = useState(false);
    const [newBankParentId, setNewBankParentId] = useState<string | null>(null);
    const [isLoadingSubBanks, setIsLoadingSubBanks] = useState(false);

    useEffect(() => {
        // If we're at the root level and data is loaded, set the current banks
        if (data && data.data && !currentBankId) {
            setCurrentBanks(data.data as unknown as Bank[]);
        }
    }, [data, currentBankId]);

    // Effect to load sub-banks when currentBankId changes (from store)
    useEffect(() => {
        const loadSubBanks = async () => {
            if (currentBankId) {
                setIsLoadingSubBanks(true);
                const subBanks = await fetchSubBanks(currentBankId);
                setCurrentBanks(subBanks);
                setIsLoadingSubBanks(false);
            }
        };

        loadSubBanks();
    }, [currentBankId]);

    const fetchSubBanks = async (bankId: string) => {
        try {
            setIsLoadingSubBanks(true);
            // Using the correct API endpoint based on the bank.route.ts backend route
            // The endpoint for getting bank hierarchy is: GET /bank/bank-:id/hierarchy
            const response = await clientAPI.get(`bank/bank-${bankId}/hierarchy`);

            if (!response.data || !response.data.data) {
                throw new Error("Failed to fetch sub-banks");
            }

            // Map sub-banks to the correct format for display
            // Sub-banks use 'name' field while parent banks use 'bank_name'
            const subBanks = response.data.data.sub_banks || [];
            return subBanks.map((subBank: any) => ({
                _id: subBank._id,
                bank_name: subBank.name, // Map 'name' to 'bank_name' for consistency
                exam_ids: subBank.exam_ids,
                sub_banks: subBank.sub_banks
            }));
        } catch (error) {
            console.error("Error fetching sub-banks:", error);
            errorHandler(error);
            return [];
        } finally {
            setIsLoadingSubBanks(false);
        }
    };

    // Handle bank delete
    const handleBankDelete = async (bankId: string) => {
        if (!confirm("Are you sure you want to delete this bank? This action cannot be undone.")) {
            return;
        }

        try {
            if (currentBankId) {
                // It's a sub-bank
                await clientAPI.delete(`bank/bank-${currentBankId}/sub-bank/${bankId}`);
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

    const handleBankDoubleClick = (bank: Bank) => {
        navigateTo(bank._id, bank.bank_name);
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

            toast.success("Bank renamed successfully");
        } catch (error) {
            console.error("Error renaming bank:", error);
            errorHandler(error);
        }
    };

    const navigateToBreadcrumb = async (index: number) => {
        // Use the store's breadcrumb navigation action
        navigateToBreadcrumbInStore(index);

        // The rest of the logic will be handled by the useEffect that watches currentBankId
        if (index === -1) {
            // Navigate to root - immediately show loading state
            setIsLoadingSubBanks(true);
            setCurrentBanks([]);

            // Small delay to ensure loading state is visible
            if (data) {
                setTimeout(() => {
                    setCurrentBanks(data.data as unknown as Bank[]);
                    setIsLoadingSubBanks(false);
                }, 300);
            } else {
                setIsLoadingSubBanks(false);
            }
        } else {
            // For non-root navigation, the useEffect will handle loading the sub-banks
            setCurrentBanks([]);
            setIsLoadingSubBanks(true);
        }
    };

    const handleCreateBank = async (bankName: string) => {
        try {
            // Determine which parent ID to use - either from context menu or current navigation
            const parentId = newBankParentId || currentBankId;

            // Create a new bank
            const response = await clientAPI.post(
                parentId ? `bank/bank-${parentId}/sub-bank` : 'bank',
                { name: bankName }
            );

            // Add the new bank to the current banks
            if (response.data) {
                const newBank = {
                    _id: response.data._id,
                    bank_name: response.data.name || bankName, // Use the returned name or fallback to input
                    sub_banks: []
                };

                setCurrentBanks(prev => [...prev, newBank]);
                toast.success("Bank created successfully");
            }
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
                <Alert color="danger" title={error} />
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
            {/* Breadcrumb navigation */}
            {breadcrumbs.length > 0 && (
                <div className="flex items-center mb-4 text-sm">
                    <button
                        onClick={() => navigateToBreadcrumb(-1)}
                        className="text-secondary hover:underline"
                    >
                        Root
                    </button>
                    {breadcrumbs.map((crumb, idx) => (
                        <div key={crumb.id} className="flex items-center">
                            <span className="mx-2 text-gray-500">/</span>
                            <button
                                onClick={() => navigateToBreadcrumb(idx)}
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
            )}

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
            ) : currentBanks.length > 0 ? (
                <div className="flex flex-wrap justify-start gap-y-4">
                    {/* Display all the bank cards */}
                    {currentBanks.map((bank, idx) => (
                        <BankCard
                            id={bank._id}
                            className="w-[222px]"
                            key={idx}
                            title={bank.bank_name}
                            examId={bank.exam_id}
                            subBanks={bank.sub_banks}
                            onDoubleClick={() => handleBankDoubleClick(bank)}
                            onRename={handleBankRename}
                            onDelete={handleBankDelete}
                        />
                    ))}

                    {/* Add folder button at the end of the list */}
                    {currentBankId && (
                        <div className="w-[222px] animate-pulse">
                            <div
                                className="flex flex-col items-center w-full relative cursor-pointer"
                                onClick={() => setIsCreateModalOpen(true)}
                            >
                                <BankAdd width={100} />
                                <div className="flex flex-col items-center pt-3">
                                    <p className="text-sm font-medium truncate w-full text-center">Add New</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="flex flex-wrap justify-start gap-6">
                    {/* If folder is empty, show the add folder button on the left */}
                    {currentBankId && (
                        <div className="w-[222px] animate-pulse">
                            <div
                                className="flex flex-col items-center w-full relative cursor-pointer"
                                onClick={() => setIsCreateModalOpen(true)}
                            >
                                <BankAdd width={100} />
                                <div className="flex flex-col items-center pt-3">
                                    <p className="text-sm font-medium truncate w-full text-center">Add New</p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex-1 p-8 text-center">
                        <p className="text-gray-500 dark:text-gray-400">This folder is empty</p>
                    </div>
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
                                className="h-16"
                                startContent={
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"></path>
                                    </svg>
                                }
                                onPress={async () => {
                                    try {
                                        setIsCreatingBank(true);

                                        // Different API endpoints and request bodies for banks vs sub-banks
                                        let response;

                                        // Determine parent ID - use newBankParentId if it exists (from context menu)
                                        // otherwise use currentBankId (from navigation)
                                        const parentId = newBankParentId || currentBankId;

                                        if (parentId) {
                                            // Creating a sub-bank
                                            const subBankRequestBody = {
                                                name: "New Bank",
                                                // If we're in an exam context, associate the exam with this sub-bank
                                                exam_ids: examId ? [examId] : undefined
                                            };

                                            // Make API call to create sub-bank
                                            response = await clientAPI.post(`bank/bank-${parentId}/sub-bank`, subBankRequestBody);
                                            toast.success("Sub-bank created successfully");
                                        } else {
                                            // Creating a root-level bank
                                            const bankRequestBody: any = {
                                                bank_name: "New Bank",
                                            };

                                            // If creating a bank for an exam, add exam ID
                                            if (examId) {
                                                bankRequestBody.exam_id = examId;
                                            }

                                            // Make API call to create bank
                                            response = await clientAPI.post('bank', bankRequestBody);
                                            toast.success("Bank created successfully");
                                        }

                                        setIsCreateModalOpen(false);

                                        // Refresh data
                                        if (currentBankId) {
                                            // Refresh sub-banks of current bank
                                            const subBanks = await fetchSubBanks(currentBankId);
                                            setCurrentBanks(subBanks);
                                        } else {
                                            // Refresh all banks
                                            mutate();
                                        }
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
                                className="h-16"
                                startContent={
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
                                        <polyline points="14 2 14 8 20 8"></polyline>
                                    </svg>
                                }
                                onPress={async () => {
                                    try {
                                        setIsCreatingExam(true);

                                        // Different API endpoints and request bodies for banks vs sub-banks
                                        let response;

                                        if (currentBankId) {
                                            // Creating a sub-bank example
                                            const subBankRequestBody = {
                                                name: "Examination",
                                                is_example: true,
                                                // If we're in an exam context, associate the exam with this sub-bank
                                                exam_ids: examId ? [examId] : undefined
                                            };

                                            // Make API call to create sub-bank
                                            response = await clientAPI.post(`bank/bank-${currentBankId}/sub-bank`, subBankRequestBody);
                                            toast.success("Examination created successfully");
                                        } else {
                                            // Creating a root-level bank
                                            const bankRequestBody: any = {
                                                bank_name: "Examination",
                                                is_example: true
                                            };

                                            // If creating a bank for an exam, add exam ID
                                            if (examId) {
                                                bankRequestBody.exam_id = examId;
                                            }

                                            // Make API call to create bank
                                            response = await clientAPI.post('bank', bankRequestBody);
                                            toast.success("Examination created successfully");
                                        }

                                        setIsCreateModalOpen(false);

                                        // Refresh data
                                        if (currentBankId) {
                                            // Refresh sub-banks of current bank
                                            const subBanks = await fetchSubBanks(currentBankId);
                                            setCurrentBanks(subBanks);
                                        } else {
                                            // Refresh all banks
                                            mutate();
                                        }
                                    } catch (error) {
                                        console.error("Error creating example:", error);
                                        errorHandler(error);
                                    } finally {
                                        setIsCreatingExam(false);
                                    }
                                }}
                            >
                                Create Examination
                            </Button>
                        </div>
                    </ModalBody>
                    <ModalFooter>
                        <Button
                            color="danger"
                            variant="light"
                            onPress={() => {
                                setIsCreateModalOpen(false);
                            }}
                        >
                            Cancel
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </div>
    );
};

export default BankList;
