"use client";

import React, { useEffect, useState } from "react";
import { 
  Button, 
  Checkbox, 
  Card, 
  CardBody,
  Breadcrumbs, 
  BreadcrumbItem,
  Spinner,
  Input
} from "@nextui-org/react";
import { 
  IcRoundFolder, 
  HealthiconsIExamMultipleChoice,
  SolarRefreshLineDuotone
} from "../icons/icons";
import { clientAPI } from "@/config/axios.config";
import { errorHandler } from "@/utils/error";

// Define interfaces
interface SubBank {
  _id: string;
  name: string;
  exam_id?: string;
  exam_ids?: string[];
  sub_banks?: SubBank[];
}

interface Bank {
  _id: string;
  bank_name: string;
  exam_id?: string;
  exam_ids?: string[];
  sub_banks?: SubBank[];
}

// Union type for bank navigation
type BankItem = Bank | SubBank;

interface Examination {
  _id: string;
  title: string;
  description?: string;
  created_at?: string;
}

interface BreadcrumbItem {
  id: string;
  name: string;
}

interface ExamSelectorProps {
  selectedExamIds: string[];
  onExamSelectionChange: (examIds: string[]) => void;
  instructorId: string;
  className?: string;
}

const ExamSelector: React.FC<ExamSelectorProps> = ({
  selectedExamIds,
  onExamSelectionChange,
  instructorId,
  className = ""
}) => {
  // Navigation state
  const [currentBankId, setCurrentBankId] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);
  const [currentBanks, setCurrentBanks] = useState<BankItem[]>([]);
  const [currentExams, setCurrentExams] = useState<Examination[]>([]);
  const [bankHierarchy, setBankHierarchy] = useState<BankItem[]>([]); // Store the navigation hierarchy
  
  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingSubBanks, setIsLoadingSubBanks] = useState(false);
  const [isLoadingExams, setIsLoadingExams] = useState(false);
  
  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filtered results based on search term
  const filteredBanks = currentBanks.filter(bank => {
    if (!bank) return false;
    // Handle both bank_name (top-level banks) and name (sub-banks)
    const bankName = 'bank_name' in bank ? bank.bank_name : bank.name;
    return bankName && bankName.toLowerCase().includes(searchTerm.toLowerCase());
  });
  
  const filteredExams = currentExams.filter(exam => 
    exam && exam.title && exam.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (exam && exam.description && exam.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Fetch top-level banks on component mount
  useEffect(() => {
    fetchTopLevelBanks();
  }, []);

  const fetchTopLevelBanks = async () => {
    try {
      setIsLoading(true);
      const response = await clientAPI.get(`bank/by-instructor/${instructorId}`);
      
      if (response.data && response.data.data) {
        const banks = response.data.data;
        setCurrentBanks(banks);
        setCurrentBankId(null);
        setBreadcrumbs([]);
        setBankHierarchy([]); // Reset bank hierarchy
        
        // At top level, don't show exams - only show banks
        setCurrentExams([]);
      }
    } catch (error) {
      console.error('Error fetching banks for instructor:', error);
      errorHandler(error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSubBanks = async (bankId: string): Promise<BankItem[]> => {
    try {
      const response = await clientAPI.get(`bank/bank-${bankId}/sub-banks`);
      if (response.data && response.data.data) {
        return response.data.data;
      }
      return [];
    } catch (error) {
      console.error('Error fetching sub-banks:', error);
      return [];
    }
  };

  const fetchExamsFromBanks = async (banks: BankItem[]) => {
    try {
      setIsLoadingExams(true);
      const allExams: Examination[] = [];
      
      // Collect exams from all banks
      for (const bank of banks) {
        if (bank.exam_ids && bank.exam_ids.length > 0) {
          // Fetch exam details for each exam ID
          for (const examId of bank.exam_ids) {
            try {
              const examResponse = await clientAPI.get(`/exam/${examId}`);
              if (examResponse.data && examResponse.data.data) {
                allExams.push(examResponse.data.data);
              }
            } catch (error) {
              console.error(`Error fetching exam ${examId}:`, error);
            }
          }
        }
      }
      
      setCurrentExams(allExams);
    } catch (error) {
      console.error('Error fetching exams from banks:', error);
      setCurrentExams([]);
    } finally {
      setIsLoadingExams(false);
    }
  };

  const fetchExams = async (bankId: string, subBankPath?: string[]) => {
    try {
      setIsLoadingExams(true);
      let url = `bank/bank-${bankId}/exams`;
      
      if (subBankPath && subBankPath.length > 0) {
        const pathString = subBankPath.join(',');
        url = `bank/bank-${bankId}/sub-bank-exams/${pathString}`;
      }
      
      const response = await clientAPI.get(url);
      if (response.data && response.data.data) {
        setCurrentExams(response.data.data);
      } else {
        setCurrentExams([]);
      }
    } catch (error) {
      console.error('Error fetching exams:', error);
      setCurrentExams([]);
    } finally {
      setIsLoadingExams(false);
    }
  };

  const handleBankClick = async (bank: BankItem) => {
    try {
      setIsLoadingSubBanks(true);
      
      // Add current bank to breadcrumbs and hierarchy
      const bankName = 'bank_name' in bank ? bank.bank_name : bank.name;
      const newBreadcrumbs = [...breadcrumbs, { id: bank._id, name: bankName }];
      const newHierarchy = [...bankHierarchy, bank];
      setBreadcrumbs(newBreadcrumbs);
      setBankHierarchy(newHierarchy);
      setCurrentBankId(bank._id);

      // Use the embedded sub-banks from the bank data instead of making API calls
      const subBanks = bank.sub_banks || [];
      setCurrentBanks(subBanks);

      // Fetch exams for this bank level
      await fetchExamsFromBanks([bank]);
      
    } catch (error) {
      console.error('Error navigating to bank:', error);
      errorHandler(error);
    } finally {
      setIsLoadingSubBanks(false);
    }
  };

  const handleBreadcrumbClick = async (index: number) => {
    try {
      setIsLoadingSubBanks(true);
      
      if (index === -1) {
        // Navigate to root - clear all navigation state
        setCurrentBankId(null);
        setBreadcrumbs([]);
        setCurrentExams([]);
        await fetchTopLevelBanks();
        return;
      }

      // Navigate to specific breadcrumb level
      const newBreadcrumbs = breadcrumbs.slice(0, index + 1);
      const newHierarchy = bankHierarchy.slice(0, index + 1);
      setBreadcrumbs(newBreadcrumbs);
      setBankHierarchy(newHierarchy);
      
      if (newBreadcrumbs.length === 0) {
        // Clear navigation state before fetching top level
        setCurrentBankId(null);
        setCurrentExams([]);
        await fetchTopLevelBanks();
        return;
      }

      // Use the stored bank from hierarchy instead of making API calls
      const targetBank = newHierarchy[newHierarchy.length - 1];
      setCurrentBankId(targetBank._id);
      
      // Use embedded sub-banks from the target bank
      const subBanks = targetBank.sub_banks || [];
      setCurrentBanks(subBanks);
      
      // Fetch exams from the target bank
      await fetchExamsFromBanks([targetBank]);

    } catch (error) {
      console.error('Error navigating via breadcrumb:', error);
      errorHandler(error);
    } finally {
      setIsLoadingSubBanks(false);
    }
  };

  const handleExamToggle = (examId: string, isSelected: boolean) => {
    let newSelectedIds: string[];
    
    if (isSelected) {
      newSelectedIds = [...selectedExamIds, examId];
    } else {
      newSelectedIds = selectedExamIds.filter(id => id !== examId);
    }
    
    onExamSelectionChange(newSelectedIds);
  };

  const fetchExamDetails = async (examId: string) => {
    try {
      const response = await clientAPI.get(`/exam/${examId}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching exam details:', error);
      return null;
    }
  };

  const BankCard = ({ bank }: { bank: BankItem }) => {  
    // Get the correct name property based on bank type
    const bankName = 'bank_name' in bank ? bank.bank_name : bank.name;
    
    return (
    <div
      className="w-[150px] cursor-pointer transition-all duration-200 hover:scale-105"
      onClick={() => handleBankClick(bank)}
    >
      <Card className="h-32 bg-zinc-800 border border-zinc-700 hover:border-zinc-600 hover:bg-zinc-700">
        <CardBody className="flex flex-col items-center justify-center p-4">
          <IcRoundFolder className="text-secondary text-4xl mb-2" />
          <p className="text-sm font-medium text-center truncate w-full">
            {bankName}
          </p>
          <div className="flex gap-1 mt-1 text-xs text-gray-400">
            {bank.sub_banks && bank.sub_banks.length > 0 && (
              <span>{bank.sub_banks.length} folders</span>
            )}
            {bank.exam_ids && bank.exam_ids.length > 0 && (
              <span>{bank.exam_ids.length} exams</span>
            )}
          </div>
        </CardBody>
      </Card>
    </div>
  );
  }

  const ExamCard = ({ exam }: { exam: Examination }) => (
    <div className="w-[150px]">
      <Card className="h-32 bg-zinc-800 border border-zinc-700 hover:border-zinc-600 transition-all duration-200">
        <CardBody className="flex flex-col p-3">
          <div className="flex items-center gap-2 mb-2">
            <Checkbox
              isSelected={selectedExamIds.includes(exam._id)}
              onValueChange={(isSelected) => handleExamToggle(exam._id, isSelected)}
              color="secondary"
              size="sm"
            />
            <HealthiconsIExamMultipleChoice className="text-secondary text-lg" />
          </div>
          <div className="flex-1 min-h-0">
            <p className="text-sm font-medium line-clamp-2 mb-1">
              {exam.title}
            </p>
            {exam.description && (
              <p className="text-xs text-gray-400 line-clamp-1 mb-1">
                {exam.description}
              </p>
            )}
            <p className="text-xs text-gray-500">
              Created: {exam.created_at ? new Date(exam.created_at).toLocaleDateString() : 'Unknown'}
            </p>
          </div>
        </CardBody>
      </Card>
    </div>
  );

  if (isLoading) {
    return (
      <div className={`flex justify-center items-center py-20 ${className}`}>
        <Spinner size="lg" color="secondary" />
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Navigation Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          {/* Breadcrumbs */}
          <Breadcrumbs separator=">" className="text-sm">
            <BreadcrumbItem 
              className="cursor-pointer hover:text-secondary"
              onClick={() => handleBreadcrumbClick(-1)}
            >
              All Banks
            </BreadcrumbItem>
            {breadcrumbs.map((crumb, index) => (
              <BreadcrumbItem 
                key={crumb.id}
                className="cursor-pointer hover:text-secondary"
                onClick={() => handleBreadcrumbClick(index)}
              >
                {crumb.name}
              </BreadcrumbItem>
            ))}
          </Breadcrumbs>
        </div>
        
        <Button
          isIconOnly
          variant="light"
          size="sm"
          onClick={breadcrumbs.length === 0 ? fetchTopLevelBanks : () => handleBreadcrumbClick(breadcrumbs.length - 1)}
          className="text-gray-400 hover:text-white"
        >
          <SolarRefreshLineDuotone className="text-lg" />
        </Button>
      </div>

      {/* Search Input */}
      <div className="mb-4">
        <Input
          placeholder="Search banks and exams..."
          value={searchTerm}
          onValueChange={setSearchTerm}
          variant="bordered"
          size="md"
          className="max-w-md"
          startContent={
            <div className="pointer-events-none flex items-center">
              <span className="text-default-400 text-small">🔍</span>
            </div>
          }
          isClearable
          onClear={() => setSearchTerm('')}
        />
      </div>

      {/* Search Results Summary */}
      {searchTerm && (filteredBanks.length > 0 || filteredExams.length > 0) && (
        <div className="mb-4 p-3 bg-primary/10 border border-primary/20 rounded-lg">
          <p className="text-sm text-primary font-medium">
            Found {filteredBanks.length} bank{filteredBanks.length === 1 ? '' : 's'} and {filteredExams.length} exam{filteredExams.length === 1 ? '' : 's'} for "{searchTerm}"
          </p>
        </div>
      )}

      {/* Selection Summary */}
      {selectedExamIds.length > 0 && (
        <div className="mb-4 p-3 bg-secondary/10 border border-secondary/20 rounded-lg">
          <p className="text-sm text-secondary font-medium">
            {selectedExamIds.length} exam{selectedExamIds.length === 1 ? '' : 's'} selected
          </p>
        </div>
      )}

      {/* Content */}
      {isLoadingSubBanks ? (
        <div className="flex justify-center items-center py-12">
          <div className="flex flex-col items-center gap-4">
            <Spinner color="secondary" />
            <p className="text-gray-500">Loading folders...</p>
          </div>
        </div>
      ) : (filteredBanks.length > 0 || filteredExams.length > 0) ? (
        <div className="flex flex-wrap justify-start gap-4">
          {/* Display banks */}
          {filteredBanks.map((bank) => (
            <BankCard key={`${bank._id}-${currentBankId || 'root'}-${breadcrumbs.length}`} bank={bank} />
          ))}
          {/* Display exams */}
          {isLoadingExams ? (
            <div className="w-[150px] h-32 flex items-center justify-center">
              <Spinner size="sm" color="secondary" />
            </div>
          ) : (
            filteredExams.map((exam) => (
              <ExamCard key={exam._id} exam={exam} />
            ))
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="text-gray-400 mb-4">
            <IcRoundFolder className="text-6xl mx-auto mb-2 opacity-50" />
            {searchTerm ? (
              <>
                <p className="text-lg font-medium">No results found for "{searchTerm}"</p>
                <p className="text-sm">Try adjusting your search terms or clearing the search</p>
              </>
            ) : (
              <>
                <p className="text-lg font-medium">No folders or exams found</p>
                <p className="text-sm">Navigate to a folder that contains exams to select them</p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamSelector;
