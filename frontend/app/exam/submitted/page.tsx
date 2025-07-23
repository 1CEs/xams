"use client"
import { useSearchParams, useRouter } from "next/navigation"
import { Button, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Checkbox, Divider, Spinner, Chip } from "@nextui-org/react"
import { Card, CardBody, CardHeader } from "@nextui-org/card"
import { SubmittedTable, type Submission } from "@/components/exam/submitted-table"
import { MdiRobot, ArrowLeft } from "@/components/icons/icons"
import { useState, useEffect } from "react"
import { useFetch } from "@/hooks/use-fetch"
import { toast } from "react-toastify"

type ValidationScope = 'all' | 'ungraded' | 'selected'

interface ExamSchedule {
  _id: string
  title: string
  description?: string
  instructor_id: string
  allowed_attempts: number
  question_count: number
  created_at: string
}

interface SubmissionData {
  _id: string
  student_id: string
  schedule_id: string
  attempt_number: number
  submitted_answers: any[]
  total_score?: number
  percentage_score?: number
  time_taken?: number
  submission_time: string
  status: 'submitted' | 'graded'
  student_info?: {
    username: string
    email: string
    profile_url?: string
  }
}

export default function SubmittedExamPage() {
  const params = useSearchParams()
  const router = useRouter()
  const scheduleId = params.get('schedule_id')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [validationScope, setValidationScope] = useState<ValidationScope | null>(null)
  const [selectedLearners, setSelectedLearners] = useState<Set<string>>(new Set())
  const [isSelectingLearners, setIsSelectingLearners] = useState(false)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(false)

  // Redirect if no schedule ID
  useEffect(() => {
    if (!scheduleId) {
      toast.error('No schedule ID provided')
      router.push('/overview')
    } else {
      console.log('Schedule ID:', scheduleId)
      console.log('Fetching from URLs:')
      console.log('- Exam Schedule:', `/exam-schedule/${scheduleId}`)
      console.log('- Submissions:', `/submission/schedule/${scheduleId}`)
    }
  }, [scheduleId, router])

  // Fetch exam schedule data
  const { data: examSchedule, isLoading: isLoadingSchedule, error: scheduleError } = useFetch<{ data: ExamSchedule }>(
    scheduleId ? `/exam-schedule/${scheduleId}` : ''
  )

  // Fetch submissions data
  const { data: submissionsData, isLoading: isLoadingSubmissionsData, error: submissionsError } = useFetch<{ data: SubmissionData[] }>(
    scheduleId ? `/submission/schedule/${scheduleId}` : ''
  )

  useEffect(() => {
    if (submissionsData?.data) {
      setSubmissions(submissionsData.data.map((submission) => ({
        _id: submission._id,
        student_id: submission.student_id,
        username: submission.student_info?.username || 'Unknown Student',
        email: submission.student_info?.email || 'No email',
        status: submission.status as 'submitted' | 'graded' | 'late',
        score: submission.total_score ?? null,
        submissionDate: new Date(submission.submission_time).toLocaleString(),
        role: 'Student',
        profile_url: submission.student_info?.profile_url || `https://i.pravatar.cc/150?u=${submission.student_id}`,
      })))
    }
  }, [submissionsData])

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
    if (submissions.length === 0) {
      toast.error('No learners available');
      return;
    }
    setIsSelectingLearners(true);
  };

  const handleView = (id: string) => {
    console.log('View submission:', id);
    // Find the submission to get student_id
    const submission = submissions.find(s => s._id === id);
    if (!submission) {
      toast.error('Submission not found');
      return;
    }
    
    // Navigate to detailed submission view with required parameters
    router.push(`/submission-history?schedule_id=${scheduleId}&student_id=${submission.student_id}`);
  };

  const handleGrade = (id: string) => {
    console.log('Grade submission:', id);
    // TODO: Implement grading interface
    toast.info('Grading interface is not yet implemented');
    // router.push(`/exam/grade?submission_id=${id}`);
  };

  // Loading state
  if (isLoadingSchedule || isLoadingSubmissionsData) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <Spinner size="lg" color="secondary" />
          <p className="mt-4 text-default-600">Loading exam submissions...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (scheduleError || submissionsError) {
    console.error('API Errors:')
    console.error('Schedule Error:', scheduleError)
    console.error('Submissions Error:', submissionsError)
    
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Card className="max-w-md">
          <CardBody className="text-center">
            <h2 className="text-xl font-bold text-danger mb-2">Error Loading Data</h2>
            <p className="text-default-600 mb-4">
              {scheduleError ? `Failed to load exam schedule: ${scheduleError}` : `Failed to load submissions: ${submissionsError}`}
            </p>
            <div className="text-xs text-left bg-gray-100 p-2 rounded mb-4">
              <p><strong>Schedule ID:</strong> {scheduleId}</p>
              <p><strong>Schedule URL:</strong> /exam-schedule/{scheduleId}</p>
              <p><strong>Submissions URL:</strong> /submission/schedule/{scheduleId}</p>
            </div>
            <Button color="secondary" onPress={() => router.push('/overview')}>
              Back to Overview
            </Button>
          </CardBody>
        </Card>
      </div>
    )
  }

  // No schedule found
  if (!examSchedule?.data) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Card className="max-w-md">
          <CardBody className="text-center">
            <h2 className="text-xl font-bold text-warning mb-2">Exam Schedule Not Found</h2>
            <p className="text-default-600 mb-4">
              The requested exam schedule could not be found.
            </p>
            <Button color="primary" onPress={() => router.push('/overview')}>
              Back to Overview
            </Button>
          </CardBody>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          isIconOnly
          variant="light"
          color="default"
          onPress={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Exam Submissions
          </h1>
          <p className="text-default-600">{examSchedule.data.title}</p>
        </div>
        <div className="text-right">
          <Chip color="secondary" variant="flat">
            {submissions.length} Submissions
          </Chip>
        </div>
      </div>

      {/* Exam Info Card */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-center w-full">
            <div>
              <h3 className="text-lg font-semibold">{examSchedule.data.title}</h3>
              {examSchedule.data.description && (
                <p className="text-sm text-default-600">{examSchedule.data.description}</p>
              )}
            </div>
            <div className="text-right space-y-1">
              <div className="text-sm text-default-600">
                <span className="font-medium">{examSchedule.data.question_count}</span> Questions
              </div>
              <div className="text-sm text-default-600">
                <span className="font-medium">{examSchedule.data.allowed_attempts}</span> Max Attempts
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>
      
      {/* Submissions Table */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Student Submissions</h3>
        </CardHeader>
        <CardBody>
          {submissions.length > 0 ? (
            <SubmittedTable 
              submissions={submissions}
              onView={handleView}
              onGrade={handleGrade}
            />
          ) : (
            <div className="text-center py-8">
              <p className="text-default-600 mb-4">No submissions found for this exam</p>
              <p className="text-sm text-default-500">
                Students haven't submitted any attempts yet.
              </p>
            </div>
          )}
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
                  {submissions.map((learner) => (
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