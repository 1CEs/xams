"use client"
import { useSearchParams } from "next/navigation"
import { Button, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Checkbox, Divider } from "@nextui-org/react"
import { Card, CardBody } from "@nextui-org/card"
import { SubmittedTable, type Submission } from "@/components/exam/submitted-table"
import { MdiRobot } from "@/components/icons/icons"
import { useState } from "react"

type ValidationScope = 'all' | 'ungraded' | 'selected'; // Added 'selected' type

// Mock data
const mockSubmissions: Submission[] = [
  {
    _id: '1',
    username: 'John Doe',
    email: 'john@example.com',
    status: 'graded',
    score: 85,
    submissionDate: '2025-06-20 14:30:00',
    role: 'Student',
    profile_url: 'https://i.pravatar.cc/150?u=john@example.com'
  },
  {
    _id: '2',
    username: 'Jane Smith',
    email: 'jane@example.com',
    status: 'submitted',
    score: null,
    submissionDate: '2025-06-21 09:15:00',
    role: 'Student',
    profile_url: 'https://i.pravatar.cc/150?u=jane@example.com'
  },
  {
    _id: '3',
    username: 'Alex Johnson',
    email: 'alex@example.com',
    status: 'late',
    score: 72,
    submissionDate: '2025-06-22 10:05:00',
    role: 'Student',
    profile_url: 'https://i.pravatar.cc/150?u=alex@example.com'
  },
  {
    _id: '4',
    username: 'Sarah Williams',
    email: 'sarah@example.com',
    status: 'graded',
    score: 93,
    submissionDate: '2025-06-20 11:20:00',
    role: 'Student',
    profile_url: 'https://i.pravatar.cc/150?u=sarah@example.com'
  },
  {
    _id: '5',
    username: 'Michael Brown',
    email: 'michael@example.com',
    status: 'submitted',
    score: null,
    submissionDate: '2025-06-21 16:45:00',
    role: 'Student',
    profile_url: 'https://i.pravatar.cc/150?u=michael@example.com'
  }
];

export default function SubmittedExamPage() {
  const params = useSearchParams();
  const examId = params.get('id');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [validationScope, setValidationScope] = useState<ValidationScope | null>(null);
  const [selectedLearners, setSelectedLearners] = useState<Set<string>>(new Set());
  const [isSelectingLearners, setIsSelectingLearners] = useState(false);

  const openModal = () => {
    setIsModalOpen(true);
    setSelectedLearners(new Set());
    setIsSelectingLearners(false);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setValidationScope(null);
    setSelectedLearners(new Set());
    setIsSelectingLearners(false);
  };

  const toggleLearnerSelection = (learnerId: string) => {
    const newSelection = new Set(selectedLearners);
    if (newSelection.has(learnerId)) {
      newSelection.delete(learnerId);
    } else {
      newSelection.add(learnerId);
    }
    setSelectedLearners(newSelection);
  };

  const handleValidation = (scope: ValidationScope) => {
    if (scope === 'selected' && selectedLearners.size === 0) {
      alert('Please select at least one learner');
      return;
    }
    
    setValidationScope(scope);
    console.log(`AI validation started for ${scope} submissions`);
    if (scope === 'selected') {
      console.log('Selected learners:', Array.from(selectedLearners));
    }
    // TODO: Implement actual AI validation logic here
    closeModal();
  };

  const handleSelectLearners = () => {
    if (mockSubmissions.length === 0) {
      alert('No learners available');
      return;
    }
    setIsSelectingLearners(true);
  };

  const handleView = (id: string) => {
    console.log('View submission:', id);
    // Add your view logic here
  };

  const handleGrade = (id: string) => {
    console.log('Grade submission:', id);
    // Add your grade logic here
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Exam Submissions</h1>
        <div className="text-gray-500">Exam ID: {examId}</div>
      </div>
      
      <Card>
        <CardBody>
          <SubmittedTable 
            submissions={mockSubmissions}
            onView={handleView}
            onGrade={handleGrade}
          />
        </CardBody>
      </Card>

      {/* Floating Action Button */}
      <Button
        isIconOnly
        color="secondary"
        radius="full"
        className="fixed animate-bounce bottom-8 right-8 z-50 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
        size="lg"
        aria-label="AI Assistant"
        onPress={openModal}
      >
        <MdiRobot className="w-6 h-6" />
      </Button>

      {/* AI Validation Modal */}
      <Modal isOpen={isModalOpen} onClose={closeModal} size={isSelectingLearners ? '2xl' : 'md'}>
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            {isSelectingLearners ? 'Select Learners' : 'AI Assistant Validation'}
          </ModalHeader>
          <ModalBody>
            {isSelectingLearners ? (
              <div className="max-h-[60vh] overflow-y-auto">
                <div className="flex flex-col gap-2">
                  {mockSubmissions.map((learner) => (
                    <div key={learner._id} className="flex items-center gap-4 p-2 hover:bg-default-100 rounded-lg">
                      <Checkbox
                        color="secondary"
                        isSelected={selectedLearners.has(learner._id)}
                        onValueChange={() => toggleLearnerSelection(learner._id)}
                        aria-label={`Select ${learner.username}`}
                      />
                      <div className="flex items-center gap-3">
                        <img
                          src={learner.profile_url}
                          alt={learner.username}
                          className="w-8 h-8 rounded-full"
                        />
                        <div>
                          <p className="font-medium">{learner.username}</p>
                          <p className="text-xs text-gray-500">{learner.email}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <>
                <p>Enable AI assistant to validate:</p>
                <div className="flex flex-col gap-2 mt-2">
                  <Button 
                    color="secondary" 
                    variant={validationScope === 'all' ? 'solid' : 'bordered'}
                    onPress={() => handleValidation('all')}
                    className="justify-start"
                  >
                    All Submissions
                  </Button>
                  <Button 
                    color="secondary" 
                    variant={validationScope === 'ungraded' ? 'solid' : 'bordered'}
                    onPress={() => handleValidation('ungraded')}
                    className="justify-start"
                  >
                    Ungraded Submissions Only
                  </Button>
                  <Button 
                    variant={validationScope === 'selected' ? 'solid' : 'bordered'}
                    onPress={handleSelectLearners}
                    className="justify-start"
                  >
                    {selectedLearners.size > 0 
                      ? `${selectedLearners.size} Learner(s) Selected` 
                      : 'Select Specific Learners...'}
                  </Button>
                </div>
              </>
            )}
          </ModalBody>
          <ModalFooter className="flex justify-between">
            {isSelectingLearners ? (
              <Button color="default" variant="light" onPress={() => setIsSelectingLearners(false)}>
                Back
              </Button>
            ) : (
              <div />
            )}
            <div className="flex gap-2">
              {isSelectingLearners && (
                <Button 
                  color="secondary" 
                  onPress={() => handleValidation('selected')}
                  isDisabled={selectedLearners.size === 0}
                >
                  Validate Selected ({selectedLearners.size})
                </Button>
              )}
              <Button color="danger" variant="light" onPress={closeModal}>
                {isSelectingLearners ? 'Cancel' : 'Close'}
              </Button>
            </div>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}