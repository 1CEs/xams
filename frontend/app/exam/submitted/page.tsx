"use client"
import { useSearchParams, useRouter } from "next/navigation"
import { Button, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Checkbox, Divider, Spinner, Chip } from "@nextui-org/react"
import { Card, CardBody, CardHeader } from "@nextui-org/card"
import { SubmittedTable, type Submission } from "@/components/exam/submitted-table"
import { MdiRobot, ArrowLeft } from "@/components/icons/icons"
import { useState, useEffect } from "react"
import { useFetch } from "@/hooks/use-fetch"
import { clientAPI } from "@/config/axios.config"
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
  const [aiResults, setAiResults] = useState<any[]>([])
  const [showResults, setShowResults] = useState(false)

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

  const handleEssayGrading = async (scope: ValidationScope) => {
    if (scope === 'selected' && selectedLearners.size === 0) {
      toast.error('Please select at least one learner');
      return;
    }
    
    setValidationScope(scope);
    setIsLoadingSubmissions(true);
    
    try {
      // Filter submissions based on scope
      let targetSubmissions = submissions;
      if (scope === 'selected') {
        targetSubmissions = submissions.filter(s => selectedLearners.has(s._id));
      } else if (scope === 'ungraded') {
        targetSubmissions = submissions.filter(s => s.status !== 'graded');
      }
      
      // Get detailed submission data for AI processing
      console.log('Target submissions for AI processing:', targetSubmissions.map(s => ({ id: s._id, username: s.username })));
      
      const submissionPromises = targetSubmissions.map(async (submission) => {
        try {
          console.log(`Fetching submission details for ID: ${submission._id}`);
          const response = await clientAPI.get(`/submission/${submission._id}`);
          const data = response.data;
          console.log(`Response for submission ${submission._id}:`, data);
          
          if (!data.success) {
            throw new Error(`API Error: ${data.message || 'Failed to fetch submission'} (ID: ${submission._id})`);
          }
        
        const fullSubmission = data.data;
        
        // Extract only essay questions (SES/LES)
        const essayQuestions = fullSubmission.submitted_answers
          .filter((answer: any) => ['ses', 'les'].includes(answer.question_type))
          .map((answer: any) => ({
            question_id: answer.question_id,
            question_text: answer.submitted_question,
            student_answer: answer.submitted_answer || '',
            max_score: answer.max_score,
            question_type: answer.question_type
          }));
        
        if (essayQuestions.length === 0) {
          return null; // Skip submissions with no essay questions
        }
        
        return {
          submission_id: fullSubmission._id,
          student_id: fullSubmission.student_id,
          student_name: submission.username,
          essay_questions: essayQuestions
        };
        } catch (error) {
          console.error(`Error processing submission ${submission._id}:`, error);
          // Return null for failed submissions so they get filtered out
          return null;
        }
      });
      
      const submissionData = (await Promise.all(submissionPromises)).filter(Boolean);
      
      if (submissionData.length === 0) {
        toast.warning('No essay questions found in selected submissions');
        closeModal();
        return;
      }
      
      // Call AI assistant for bulk grading
      const aiResponse = await clientAPI.post('/assistant/bulk-grade-essays', {
        submissions: submissionData,
        scope: scope
      });
      
      const aiData = aiResponse.data;
      
      if (aiData.status === 200) {
        const { results, summary } = aiData.data;
        
        toast.success(
          `AI grading suggestions generated! Processed ${summary.processed_essay_questions} essay questions from ${summary.processed_submissions} submissions.`
        );
        
        // Store results for display
        setAiResults(results);
        setShowResults(true);
        
        console.log('AI Grading Results:', results);
        
      } else {
        toast.error(aiData.message || 'Failed to generate AI grading suggestions');
      }
      
    } catch (error) {
      console.error('Error in AI essay grading:', error);
      toast.error('Failed to process AI essay grading');
    } finally {
      setIsLoadingSubmissions(false);
      closeModal();
    }
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
        aria-label="AI Essay Grading Assistant"
        onPress={openModal}
      >
        <MdiRobot className="w-6 h-6" />
      </Button>

      {/* AI Validation Modal */}
      <Modal isOpen={isModalOpen} onClose={closeModal} size={isSelectingLearners ? '2xl' : 'md'}>
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            {isSelectingLearners ? 'Select Learners' : 'AI Essay Grading Assistant'}
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
                <p>Generate AI grading suggestions for essay questions:</p>
                <div className="flex flex-col gap-2 mt-2">
                  <Button 
                    color="secondary" 
                    variant={validationScope === 'all' ? 'solid' : 'bordered'}
                    onPress={() => handleEssayGrading('all')}
                    className="justify-start"
                    isLoading={isLoadingSubmissions && validationScope === 'all'}
                  >
                    All Submissions
                  </Button>
                  <Button 
                    color="secondary" 
                    variant={validationScope === 'ungraded' ? 'solid' : 'bordered'}
                    onPress={() => handleEssayGrading('ungraded')}
                    className="justify-start"
                    isLoading={isLoadingSubmissions && validationScope === 'ungraded'}
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
                  onPress={() => handleEssayGrading('selected')}
                  isDisabled={selectedLearners.size === 0}
                  isLoading={isLoadingSubmissions && validationScope === 'selected'}
                >
                  Grade Selected ({selectedLearners.size})
                </Button>
              )}
              <Button color="danger" variant="light" onPress={closeModal}>
                {isSelectingLearners ? 'Cancel' : 'Close'}
              </Button>
            </div>
          </ModalFooter>
        </ModalContent>
      </Modal>
      
      {/* AI Results Modal */}
      <Modal 
        isOpen={showResults} 
        onClose={() => setShowResults(false)} 
        size="5xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <MdiRobot className="w-5 h-5" />
              <span>AI Essay Grading Suggestions</span>
              <Chip size="sm" color="secondary" variant="flat">
                {aiResults.length} Student{aiResults.length !== 1 ? 's' : ''}
              </Chip>
            </div>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-6">
              {aiResults.map((result: any) => (
                <Card key={result.submission_id} className="w-full">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center text-white font-semibold">
                          {result.student_name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold">{result.student_name}</h3>
                          <p className="text-sm text-default-500">
                            {result.processed_essays} of {result.total_essays} essay questions processed
                          </p>
                        </div>
                      </div>
                      <Chip 
                        size="sm" 
                        color={result.processed_essays === result.total_essays ? 'success' : 'warning'}
                        variant="flat"
                      >
                        {result.processed_essays === result.total_essays ? 'Complete' : 'Partial'}
                      </Chip>
                    </div>
                  </CardHeader>
                  <CardBody className="pt-0">
                    <div className="space-y-4">
                      {result.questions.map((question: any, index: number) => (
                        <div key={question.question_id || index} className="border-l-4 border-primary/30 pl-4">
                          {question.success ? (
                            <div className="space-y-3">
                              <div className="flex items-center gap-2">
                                <Chip size="sm" color="secondary" variant="bordered">
                                  {question.question_type === 'ses' ? 'Short Essay' : 'Long Essay'}
                                </Chip>
                                <span className="text-sm text-default-600">
                                  Max Score: {question.max_score} points
                                </span>
                              </div>
                              
                              <div className="bg-default-50 rounded-lg p-4 border">
                                <h4 className="text-sm font-medium text-primary-700 mb-2">
                                  🤖 AI Grading Suggestion:
                                </h4>
                                <div className="text-sm text-default-800 whitespace-pre-wrap">
                                  {question.suggestion}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="bg-danger-50 rounded-lg p-3 border border-danger-200">
                              <p className="text-sm text-danger-600">
                                ⚠️ Error: {question.error}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
            
            <div className="text-xs text-default-500 mt-4 p-3 bg-warning-50 rounded-lg border border-warning-200">
              💡 <strong>Important:</strong> These are AI-generated suggestions for guidance only. 
              Please use your professional judgment and review each suggestion carefully before applying any grades.
            </div>
          </ModalBody>
          <ModalFooter>
            <Button 
              color="secondary" 
              onPress={() => setShowResults(false)}
            >
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}