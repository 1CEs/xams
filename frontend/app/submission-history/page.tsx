"use client"

import React, { useEffect, useState, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { clientAPI } from '@/config/axios.config'
import { Accordion, AccordionItem, Button, Card, CardBody, CardHeader, Chip, Divider, Radio, RadioGroup, Spinner, Input, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure, Select, SelectItem, user } from '@nextui-org/react'
import { ArrowLeft, FileDocument, Clock, CheckCircle, CloseCircle } from '@/components/icons/icons'
import { useUserStore } from '@/stores/user.store'
import { toast } from 'react-toastify'

// Inline ChevronDown icon component
const ChevronDown = ({ className, isRotated }: { className?: string; isRotated?: boolean }) => (
  <svg
    className={`transition-transform duration-200 ${isRotated ? 'rotate-180' : ''} ${className || ''}`}
    xmlns="http://www.w3.org/2000/svg"
    width="1em"
    height="1em"
    viewBox="0 0 24 24"
  >
    <path fill="currentColor" d="M7.41 8.58L12 13.17l4.59-4.59L18 10l-6 6l-6-6z" />
  </svg>
)

interface SubmittedAnswer {
  question_id: string
  submitted_question: string
  question_type: 'mc' | 'tf' | 'ses' | 'les' | 'nested'
  nested_answers?: SubmittedAnswer[] // For nested questions - array of sub-question answers
  submitted_choices?: string[]
  submitted_answer?: string
  submitted_boolean?: boolean
  original_choices?: Array<{ // For display purposes (MC questions)
    content: string
    isCorrect: boolean
  }>
  is_correct?: boolean
  score_obtained?: number
  max_score: number
  graded_nested_answers?: SubmittedAnswer[] // Graded nested answers (after grading process)
}

interface ExamSubmission {
  _id: string
  schedule_id: string
  student_id: string
  course_id: string
  group_id: string
  submitted_answers: SubmittedAnswer[]
  submission_time: Date
  time_taken?: number
  total_score?: number
  max_possible_score: number
  percentage_score?: number
  is_graded: boolean
  graded_at?: Date
  graded_by?: string
  status: 'submitted' | 'graded' | 'reviewed'
  attempt_number: number
  created_at: Date
  updated_at: Date
  // Student information (populated when needed)
  student_info?: {
    username: string
    email: string
    profile_url?: string
    full_name: string
  }
}

interface ExamSchedule {
  _id: string
  title: string
  description?: string
  allowed_attempts: number
  allowed_review: boolean
  show_answer: boolean
  total_score?: number
  questions?: Array<{
    _id: string
    type: string
    question: string
    expectedAnswers?: string[]
    expectedAnswer?: string
    score: number
  }>
}

const SubmissionHistoryPage = () => {
  const params = useSearchParams()
  const schedule_id = params.get('schedule_id')
  const student_id = params.get('student_id')
  const question_id = params.get('question_id') // New: question filtering
  const { user } = useUserStore()
  const router = useRouter()

  const [submissions, setSubmissions] = useState<ExamSubmission[]>([])
  const [examSchedule, setExamSchedule] = useState<ExamSchedule | null>(null)
  const [loading, setLoading] = useState(true)
  const [userLoaded, setUserLoaded] = useState(false)
  const [currentQuestionPage, setCurrentQuestionPage] = useState<{ [submissionId: string]: number }>({})
  const questionsPerPage = 5

  // Manual grading state
  const { isOpen: isGradingModalOpen, onOpen: onGradingModalOpen, onOpenChange: onGradingModalOpenChange } = useDisclosure()
  const [gradingQuestion, setGradingQuestion] = useState<{ submissionId: string, questionId: string, answer: SubmittedAnswer } | null>(null)
  const [gradingScore, setGradingScore] = useState('')
  const [isGradingLoading, setIsGradingLoading] = useState(false)

  // AI Assistant state
  const [aiSuggestion, setAiSuggestion] = useState<string>('')
  const [isAiLoading, setIsAiLoading] = useState(false)
  const [showAiSuggestion, setShowAiSuggestion] = useState(false)

  // Question type filter state
  const [questionTypeFilter, setQuestionTypeFilter] = useState<string>('all')

  // Question-specific data
  const [targetQuestion, setTargetQuestion] = useState<any>(null)

  // Collapse/expand state for submission cards
  const [expandedSubmissions, setExpandedSubmissions] = useState<{ [submissionId: string]: boolean }>({})

  // Toggle submission card expand/collapse
  const toggleSubmissionExpanded = (submissionId: string) => {
    setExpandedSubmissions(prev => ({
      ...prev,
      [submissionId]: !prev[submissionId]
    }))
  }

  // Fetch student information by ID
  const fetchStudentInfo = async (studentId: string) => {
    try {
      const response = await clientAPI.get(`/user/${studentId}`)
      if (response.data.code === 200) {
        return {
          email: response.data.data.email,
          profile_url: response.data.data.profile_url,
          full_name: response.data.data.info.first_name + ' ' + response.data.data.info.last_name
        }
      }
    } catch (error) {
      console.error('Error fetching student info:', error)
    }
    return null
  }

  // Check if user is loaded from localStorage
  useEffect(() => {
    // Wait a bit for Zustand to rehydrate from localStorage
    const timer = setTimeout(() => {
      setUserLoaded(true)
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  // Validate access and fetch data
  useEffect(() => {
    // Don't run validation until user is loaded
    if (!userLoaded) {
      return
    }

    const fetchData = async () => {
      if (!schedule_id || !user) {
        toast.error('Missing required parameters')
        router.push('/overview')
        return
      }

      // For question-specific view, only instructors can access
      if (question_id && user.role !== 'instructor') {
        toast.error('You do not have permission to view this page')
        router.push('/overview')
        return
      }

      // For student-specific view, validate access
      if (!question_id && (!student_id || (user._id !== student_id && user.role !== 'instructor'))) {
        toast.error('You do not have permission to view this submission history')
        router.push('/overview')
        return
      }

      try {
        // Fetch exam schedule details
        const scheduleResponse = await clientAPI.get(`/exam-schedule/${schedule_id}`)
        if (scheduleResponse.data.code === 200) {
          const scheduleData = scheduleResponse.data.data
          setExamSchedule(scheduleData)

          // If filtering by question, find the target question
          if (question_id && scheduleData.questions) {
            const foundQuestion = scheduleData.questions.find((q: any) => q._id === question_id)
            if (foundQuestion) {
              setTargetQuestion(foundQuestion)
            }
          }
        }

        // Fetch submissions for this schedule
        const submissionsResponse = await clientAPI.get(`/submission/schedule/${schedule_id}`)
        if (submissionsResponse.data.success) {
          let filteredSubmissions = submissionsResponse.data.data

          if (question_id) {
            // For question-specific view, get all submissions but filter answers to show only the target question
            filteredSubmissions = filteredSubmissions.map((submission: ExamSubmission) => ({
              ...submission,
              submitted_answers: submission.submitted_answers.filter(
                (answer: SubmittedAnswer) => answer.question_id === question_id
              )
            })).filter((submission: ExamSubmission) => submission.submitted_answers.length > 0)
          } else if (student_id) {
            // For student-specific view, filter by student
            filteredSubmissions = filteredSubmissions.filter(
              (submission: ExamSubmission) => submission.student_id === student_id
            )
          }

          // Sort by attempt number (latest first)
          filteredSubmissions.sort((a: ExamSubmission, b: ExamSubmission) => b.attempt_number - a.attempt_number)

          // For question-specific view, fetch student information
          if (question_id && filteredSubmissions.length > 0) {
            const uniqueStudentIds: string[] = Array.from(new Set(filteredSubmissions.map((s: ExamSubmission) => s.student_id)))
            const studentInfoPromises = uniqueStudentIds.map((studentId: string) =>
              fetchStudentInfo(studentId).then(info => ({ studentId, info }))
            )

            const studentInfoResults = await Promise.all(studentInfoPromises)
            const studentInfoMap = new Map<string, any>()

            studentInfoResults.forEach(({ studentId, info }: { studentId: string; info: any }) => {
              if (info) {
                studentInfoMap.set(studentId, info)
              }
            })

            // Add student info to submissions
            filteredSubmissions = filteredSubmissions.map((submission: ExamSubmission) => ({
              ...submission,
              student_info: studentInfoMap.get(submission.student_id)
            }))
          }

          setSubmissions(filteredSubmissions)

          // Expand the first submission by default
          if (filteredSubmissions.length > 0) {
            setExpandedSubmissions({ [filteredSubmissions[0]._id]: true })
          }
        }
      } catch (error) {
        console.error('Error fetching submission history:', error)
        toast.error('Failed to load submission history')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [schedule_id, student_id, question_id, user, router, userLoaded])

  // Question navigation helpers
  const getCurrentQuestionPage = (submissionId: string) => {
    return currentQuestionPage[submissionId] || 1
  }

  const setSubmissionQuestionPage = (submissionId: string, page: number) => {
    setCurrentQuestionPage(prev => ({
      ...prev,
      [submissionId]: page
    }))
  }

  const handleQuestionNavigation = (submissionId: string, questionIndex: number) => {
    const page = Math.floor(questionIndex / questionsPerPage) + 1
    setSubmissionQuestionPage(submissionId, page)

    // Smooth scroll to the question
    const questionElement = document.getElementById(`question-${submissionId}-${questionIndex}`)
    if (questionElement) {
      questionElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  const getCurrentQuestions = (submission: ExamSubmission) => {
    const currentPage = getCurrentQuestionPage(submission._id)
    const startIndex = (currentPage - 1) * questionsPerPage
    const endIndex = startIndex + questionsPerPage
    return {
      questions: submission.submitted_answers.slice(startIndex, endIndex),
      startIndex,
      totalPages: Math.ceil(submission.submitted_answers.length / questionsPerPage),
      currentPage
    }
  }

  // Filter questions by type
  const filterQuestionsByType = (answers: SubmittedAnswer[]) => {
    if (questionTypeFilter === 'all') {
      return answers
    }
    return answers.filter(answer => answer.question_type === questionTypeFilter)
  }

  // Get filtered questions with pagination
  const getFilteredQuestions = (submission: ExamSubmission) => {
    const filteredAnswers = filterQuestionsByType(submission.submitted_answers)
    const currentPage = getCurrentQuestionPage(submission._id)
    const startIndex = (currentPage - 1) * questionsPerPage
    const endIndex = startIndex + questionsPerPage
    return {
      questions: filteredAnswers.slice(startIndex, endIndex),
      startIndex,
      totalPages: Math.ceil(filteredAnswers.length / questionsPerPage),
      currentPage,
      totalFiltered: filteredAnswers.length,
      allFiltered: filteredAnswers
    }
  }

  // Check if pagination should be used
  const shouldUsePagination = (submission: ExamSubmission) => {
    const filteredAnswers = filterQuestionsByType(submission.submitted_answers)
    return filteredAnswers.length > questionsPerPage
  }

  // Get question type label
  const getQuestionTypeLabel = (type: string) => {
    switch (type) {
      case 'mc': return 'Multiple Choice'
      case 'tf': return 'True/False'
      case 'ses': return 'Short Essay'
      case 'les': return 'Long Essay'
      case 'nested': return 'Nested Questions'
      default: return type.toUpperCase()
    }
  }

  // Question type options for filter
  const questionTypeOptions = [
    { key: 'all', label: 'All Questions' },
    { key: 'mc', label: 'Multiple Choice (MC)' },
    { key: 'tf', label: 'True/False (TF)' },
    { key: 'ses', label: 'Short Essay (SES)' },
    { key: 'les', label: 'Long Essay (LES)' },
    { key: 'nested', label: 'Nested Questions (NESTED)' }
  ]

  // Format date and time
  const formatDateTime = (date: Date) => {
    const dateObj = new Date(date)
    return {
      date: dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }),
      time: dateObj.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })
    }
  }

  // Format time taken
  // Strip HTML tags from content
  const stripHtmlTags = (content: string): string => {
    if (!content) return ''
    return content.replace(/<[^>]*>/g, '').trim()
  }

  const formatTimeTaken = (seconds?: number) => {
    if (!seconds) return 'N/A'
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`
    } else {
      return `${secs}s`
    }
  }

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted': return 'warning'
      case 'graded': return 'success'
      case 'reviewed': return 'primary'
      default: return 'default'
    }
  }

  // Get expected answers for a question
  const getExpectedAnswers = (questionId: string): string[] => {
    if (!examSchedule?.questions) return []

    const question = examSchedule.questions.find(q => q._id === questionId)
    if (!question) return []

    // Handle both expectedAnswers array and expectedAnswer string
    if (question.expectedAnswers && question.expectedAnswers.length > 0) {
      return question.expectedAnswers
    } else if (question.expectedAnswer) {
      return [question.expectedAnswer]
    }

    return []
  }

  // Check if expected answers should be shown
  const shouldShowExpectedAnswers = (questionType: string): boolean => {
    // Only show for SES and LES questions
    if (questionType !== 'ses' && questionType !== 'les') return false

    // Show if user is instructor OR if show_answer is true
    return user?.role === 'instructor' || (examSchedule?.show_answer === true)
  }

  // Manual grading functions
  const handleOpenGradingModal = (submissionId: string, questionId: string, answer: SubmittedAnswer) => {
    setGradingQuestion({ submissionId, questionId, answer })
    setGradingScore(answer.score_obtained?.toString() || '')
    // Reset AI suggestion state
    resetAiSuggestion()
    onGradingModalOpen()
  }

  const handleManualGrade = async () => {
    if (!gradingQuestion || !user) return

    const score = parseFloat(gradingScore)
    if (isNaN(score) || score < 0 || score > gradingQuestion.answer.max_score) {
      toast.error(`Score must be between 0 and ${gradingQuestion.answer.max_score}`)
      return
    }

    setIsGradingLoading(true)
    try {
      const response = await clientAPI.post('/submission/grade-question', {
        submission_id: gradingQuestion.submissionId,
        question_id: gradingQuestion.questionId,
        score_obtained: score,
        is_correct: score > 0,
        graded_by: user._id
      })

      if (response.data.success) {
        toast.success('Question graded successfully')

        // Update the submissions state with the new grading data
        setSubmissions(prevSubmissions =>
          prevSubmissions.map(submission => {
            if (submission._id === gradingQuestion.submissionId) {
              const updatedAnswers = submission.submitted_answers.map(answer => {
                if (answer.question_id === gradingQuestion.questionId) {
                  return {
                    ...answer,
                    score_obtained: score,
                    is_correct: score > 0
                  }
                }
                return answer
              })

              // Recalculate total score
              const totalScore = updatedAnswers.reduce((sum, answer) => sum + (answer.score_obtained || 0), 0)
              const percentageScore = (examSchedule?.total_score || submission.max_possible_score) > 0
                ? (totalScore / (examSchedule?.total_score || submission.max_possible_score)) * 100
                : 0

              // Check if all essay questions are graded
              const allEssayQuestionsGraded = updatedAnswers.every(answer => {
                if (answer.question_type === 'ses' || answer.question_type === 'les') {
                  return answer.score_obtained !== undefined && answer.is_correct !== undefined
                }
                return true
              })

              return {
                ...submission,
                submitted_answers: updatedAnswers,
                total_score: totalScore,
                percentage_score: percentageScore,
                is_graded: allEssayQuestionsGraded,
                status: allEssayQuestionsGraded ? 'graded' as const : 'submitted' as const,
                graded_at: new Date(),
                graded_by: user._id
              }
            }
            return submission
          })
        )

        onGradingModalOpenChange()
        setGradingQuestion(null)
        setGradingScore('')
        // Reset AI suggestion
        resetAiSuggestion()
      } else {
        toast.error(response.data.message || 'Failed to grade question')
      }
    } catch (error) {
      console.error('Error grading question:', error)
      toast.error('Failed to grade question')
    } finally {
      setIsGradingLoading(false)
    }
  }

  // AI Assistant functions
  const handleGetAiSuggestion = async () => {
    if (!gradingQuestion) return

    // Only handle essay questions
    if (!['ses', 'les'].includes(gradingQuestion.answer.question_type)) {
      toast.error('AI assistance is only available for essay questions')
      return
    }

    setIsAiLoading(true)
    setAiSuggestion('')
    setShowAiSuggestion(false)

    try {
      const response = await clientAPI.post('/assistant/grade-essay', {
        question: gradingQuestion.answer.submitted_question,
        student_answer: gradingQuestion.answer.submitted_answer || '',
        max_score: gradingQuestion.answer.max_score,
        question_type: gradingQuestion.answer.question_type
      })

      if (response.data.status === 200) {
        setAiSuggestion(response.data.data.suggestion)
        setShowAiSuggestion(true)
        toast.success('AI grading suggestion generated')
      } else {
        toast.error(response.data.message || 'Failed to get AI suggestion')
      }
    } catch (error) {
      console.error('Error getting AI suggestion:', error)
      toast.error('Failed to get AI grading suggestion')
    } finally {
      setIsAiLoading(false)
    }
  }

  const resetAiSuggestion = () => {
    setAiSuggestion('')
    setShowAiSuggestion(false)
  }

  // Calculate statistics
  const statistics = useMemo(() => {
    if (submissions.length === 0) return null

    const gradedSubmissions = submissions.filter(s => s.is_graded && s.percentage_score !== undefined)
    const averageScore = gradedSubmissions.length > 0
      ? gradedSubmissions.reduce((sum, s) => sum + (s.percentage_score || 0), 0) / gradedSubmissions.length
      : 0

    const bestScore = gradedSubmissions.length > 0
      ? Math.max(...gradedSubmissions.map(s => s.percentage_score || 0))
      : 0

    return {
      totalAttempts: submissions.length,
      gradedAttempts: gradedSubmissions.length,
      averageScore: Math.round(averageScore * 100) / 100,
      bestScore: Math.round(bestScore * 100) / 100
    }
  }, [submissions])

  if (loading || !userLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-default-50 to-primary/10 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Spinner size="lg" color="primary" />
              <p className="mt-4 text-default-600">
                {!userLoaded ? 'Loading user data...' : 'Loading submission history...'}
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-default-50 to-primary/10 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="light"
            startContent={<ArrowLeft className="w-4 h-4" />}
            onPress={() => router.back()}
            className="mb-4"
          >
            Back
          </Button>

          <div className="bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 rounded-2xl p-6 border border-primary/20">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center text-white">
                <FileDocument className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  {question_id ? 'Question Submissions' : 'Submission History'}
                </h1>
                <p className="text-default-600">
                  {examSchedule?.title || 'Exam Schedule'}
                </p>
                {question_id && targetQuestion && (
                  <div className="mt-2">
                    <Chip size="sm" color="primary" variant="flat">
                      {targetQuestion.type?.toUpperCase()} Question
                    </Chip>
                    <p className="text-sm text-default-500 mt-1">
                      {stripHtmlTags(targetQuestion.question).substring(0, 100)}...
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Statistics */}
            {statistics && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-background/50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-secondary">{statistics.totalAttempts}</div>
                  <div className="text-sm text-default-600">{question_id ? 'Total Submissions' : 'Total Attempts'}</div>
                </div>
                <div className="bg-background/50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-secondary">{statistics.gradedAttempts}</div>
                  <div className="text-sm text-default-600">Graded</div>
                </div>
                <div className="bg-background/50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-warning">{statistics.averageScore}%</div>
                  <div className="text-sm text-default-600">Average Score</div>
                </div>
                <div className="bg-background/50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-secondary">{statistics.bestScore}%</div>
                  <div className="text-sm text-default-600">{question_id ? 'Highest Score' : 'Best Score'}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Submissions List */}
        <div className="space-y-4">
          {submissions.length === 0 ? (
            <Card className="p-8">
              <CardBody className="text-center">
                <div className="w-16 h-16 bg-default-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileDocument className="w-8 h-8 text-default-400" />
                </div>
                <h3 className="text-lg font-semibold text-default-600 mb-2">No Submissions Found</h3>
                <p className="text-default-500">
                  {question_id
                    ? 'No learners have submitted answers for this question yet.'
                    : 'You haven\'t submitted this exam yet.'
                  }
                </p>
              </CardBody>
            </Card>
          ) : (
            submissions.map((submission, index) => {
              const submissionDateTime = formatDateTime(submission.submission_time)
              const gradedDateTime = submission.graded_at ? formatDateTime(submission.graded_at) : null

              return (
                <Card key={submission._id} className={`hover:shadow-md transition-all duration-200 ${expandedSubmissions[submission._id]
                  ? 'shadow-md border-primary/20'
                  : 'hover:border-primary/10'
                  }`}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-3">
                        {question_id && submission.student_info ? (
                          // Show student profile picture for question-specific view
                          <img
                            src={submission.student_info.profile_url || `https://i.pravatar.cc/150?u=${submission.student_id}`}
                            alt={submission.student_info.full_name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          // Show attempt number for student-specific view
                          <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg flex items-center justify-center">
                            <span className="font-bold text-primary">#{submission.attempt_number}</span>
                          </div>
                        )}
                        <div>
                          <h3 className="font-semibold">
                            {question_id ? (
                              submission.student_info?.full_name || `Learner ${submission.student_id}`
                            ) : (
                              `Attempt ${submission.attempt_number}`
                            )}
                          </h3>
                          <p className="text-sm text-default-600">
                            {question_id && submission.student_info && (
                              <span className="text-default-500">{submission.student_info.email} • </span>
                            )}
                            Submitted on {submissionDateTime.date} at {submissionDateTime.time}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Chip
                          size="sm"
                          variant="flat"
                          color={getStatusColor(submission.status)}
                        >
                          {submission.status.toUpperCase()}
                        </Chip>
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          onPress={() => toggleSubmissionExpanded(submission._id)}
                          className="text-default-600 hover:text-primary"
                        >
                          <ChevronDown
                            className="w-4 h-4"
                            isRotated={expandedSubmissions[submission._id]}
                          />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  {/* Always visible summary */}
                  {!expandedSubmissions[submission._id] && <div className="px-6 pb-3">
                    <div className="flex items-center justify-between text-sm text-default-600">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {formatTimeTaken(submission.time_taken)}
                        </span>
                        <span>{submission.submitted_answers.length} questions</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {submission.is_graded ? (
                          <span className={`font-medium ${submission.percentage_score && submission.percentage_score >= 70
                            ? 'text-success'
                            : 'text-danger'
                            }`}>
                            {submission.total_score}/{examSchedule?.total_score || submission.max_possible_score} ({submission.percentage_score?.toFixed(1)}%)
                          </span>
                        ) : (
                          <span className="text-warning font-medium">Pending</span>
                        )}
                      </div>
                    </div>
                  </div>}

                  {expandedSubmissions[submission._id] && (
                    <CardBody className="pt-0">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-sm text-default-600">Time Taken</p>
                          <p className="font-medium flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {formatTimeTaken(submission.time_taken)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-default-600">Questions</p>
                          <p className="font-medium">{submission.submitted_answers.length}</p>
                        </div>
                        <div>
                          <p className="text-sm text-default-600">Score</p>
                          <p className="font-medium">
                            {submission.is_graded ? (
                              <span className={`${submission.percentage_score && submission.percentage_score >= 70 ? 'text-success' : 'text-danger'}`}>
                                {submission.total_score}/{examSchedule?.total_score || submission.max_possible_score} ({submission.percentage_score?.toFixed(1)}%)
                              </span>
                            ) : (
                              <span className="text-warning">Pending</span>
                            )}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-default-600">Graded</p>
                          <p className="font-medium">
                            {submission.is_graded ? (
                              <span className="text-success flex items-center gap-1">
                                <CheckCircle className="w-4 h-4" />
                                {gradedDateTime ? `${gradedDateTime.date}` : 'Yes'}
                              </span>
                            ) : (
                              <span className="text-warning flex items-center gap-1">
                                <CloseCircle className="w-4 h-4" />
                                No
                              </span>
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Questions and Answers Section */}
                      {(examSchedule?.allowed_review && submission.is_graded) && (
                        <div className="mt-6">
                          <Divider className="mb-4" />
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="font-semibold text-lg">
                              {user?.role !== 'instructor' ? "Your Submission Review" : "Learner Submission Review"}
                            </h4>
                            {!question_id && 
                            <div className="flex items-center justify-between">
                              {/* Question Type Filter */}
                              <div className="flex justify-center items-center gap-2">
                                <span className="text-sm text-default-600">Filter by type:</span>
                                <Select
                                  size="sm"
                                  placeholder="All Questions"
                                  selectedKeys={questionTypeFilter ? [questionTypeFilter] : ['all']}
                                  onSelectionChange={(keys) => {
                                    const selected = Array.from(keys)[0] as string
                                    setQuestionTypeFilter(selected || 'all')
                                    // Reset pagination when filter changes
                                    setCurrentQuestionPage({})
                                  }}
                                  className="w-48"
                                  variant="bordered"
                                >
                                  {questionTypeOptions.map((option) => (
                                    <SelectItem key={option.key} value={option.key}>
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </Select>
                              </div>
                            </div>}
                          </div>




                          {shouldUsePagination(submission) ? (
                            // Paginated view for many questions
                            <div className="flex gap-6">
                              {/* Question Navigation Sidebar */}
                              <Card className="w-1/3 h-fit sticky top-4">
                                <CardBody className="px-4 py-4">
                                  <div className="flex flex-col gap-4">
                                    {(() => {
                                      const filteredData = getFilteredQuestions(submission)
                                      return (
                                        <>
                                          <div className="flex justify-between items-center">
                                            <h3 className="text-md font-semibold">Questions Navigation</h3>
                                            <div className="text-sm text-default-600">
                                              {questionTypeFilter !== 'all' ? (
                                                <span>
                                                  {filteredData.totalFiltered} / {submission.submitted_answers.length} questions
                                                </span>
                                              ) : (
                                                <span>{submission.submitted_answers.length} questions</span>
                                              )}
                                            </div>
                                          </div>

                                          <div className="grid grid-cols-5 gap-2">
                                            {filteredData.allFiltered.map((answer, index) => {
                                              const currentPage = getCurrentQuestionPage(submission._id)
                                              const questionPage = Math.floor(index / questionsPerPage) + 1
                                              const isCurrentPage = questionPage === currentPage

                                              return (
                                                <Button
                                                  key={answer.question_id}
                                                  size="sm"
                                                  color="default"
                                                  onPress={() => handleQuestionNavigation(submission._id, index)}
                                                  className={`
                                                  ${isCurrentPage ? 'border-primary border-2 bg-primary/10' : 'border-default-200 border'}
                                                  ${answer.is_correct === true ? 'bg-success/20' : ''}
                                                  ${answer.is_correct === false ? 'bg-danger/20' : ''}
                                                `}
                                                >
                                                  {index + 1}
                                                </Button>
                                              )
                                            })}
                                          </div>
                                        </>
                                      )
                                    })()}

                                    <div className="text-sm text-default-600">
                                      <div className="flex items-center gap-2 mb-1">
                                        <div className="w-3 h-3 bg-success/20 border border-success rounded"></div>
                                        <span>Correct</span>
                                      </div>
                                      <div className="flex items-center gap-2 mb-1">
                                        <div className="w-3 h-3 bg-danger/20 border border-danger rounded"></div>
                                        <span>Incorrect</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 border-primary border-2 rounded"></div>
                                        <span>Current page</span>
                                      </div>
                                    </div>

                                    {(() => {
                                      const filteredData = getFilteredQuestions(submission)
                                      return (
                                        <p className="text-sm text-default-500">
                                          Page {filteredData.currentPage} of {filteredData.totalPages}
                                        </p>
                                      )
                                    })()}
                                  </div>
                                </CardBody>
                              </Card>

                              {/* Questions Content */}
                              <div className="w-2/3">
                                <div className="space-y-4">
                                  {(() => {
                                    const { questions, startIndex, currentPage, totalPages } = getFilteredQuestions(submission)
                                    return (
                                      <>
                                        {questions.map((answer, relativeIndex) => {
                                          const absoluteIndex = startIndex + relativeIndex
                                          return (
                                            <div
                                              key={answer.question_id}
                                              id={`question-${submission._id}-${absoluteIndex}`}
                                              className="border border-default-200 rounded-lg p-4 bg-default-50"
                                            >
                                              <div className="flex items-center justify-between mb-3">
                                                <span className="font-medium text-sm text-primary">Question {absoluteIndex + 1}</span>
                                                <div className="flex items-center gap-2">
                                                  {/* Show correctness status if available */}
                                                  {answer.is_correct !== undefined && (
                                                    <Chip
                                                      size="sm"
                                                      variant="flat"
                                                      color={answer.is_correct ? 'success' : 'danger'}
                                                    >
                                                      {answer.is_correct ? 'Correct' : 'Incorrect'}
                                                    </Chip>
                                                  )}

                                                  {/* Show score if available, otherwise show max possible score */}
                                                  <span className="text-sm font-medium">
                                                    {answer.score_obtained !== undefined
                                                      ? `${answer.score_obtained}/${answer.max_score} pts`
                                                      : `Max: ${answer.max_score} pts`
                                                    }
                                                  </span>

                                                  {/* Show question type for instructors */}
                                                  {user?.role === 'instructor' && (
                                                    <Chip size="sm" variant="bordered" color="default">
                                                      {answer.question_type.toUpperCase()}
                                                    </Chip>
                                                  )}
                                                </div>
                                              </div>

                                              {/* Question Text */}
                                              <p className="text-sm text-default-700 mb-3 font-medium">
                                                {stripHtmlTags(answer.submitted_question)}
                                              </p>

                                              {/* Answer Section with Accordion */}
                                              {answer.question_type === 'mc' && answer.original_choices ? (
                                                <Accordion variant="bordered">
                                                  <AccordionItem
                                                    key="choices"
                                                    aria-label="Question Choices"
                                                    title={
                                                      <div className="flex items-center gap-2">
                                                        <span className="text-sm font-medium">
                                                          {user?.role === 'instructor' ? "Learner answer:" : "Your answer:"}
                                                        </span>
                                                        <span className="text-sm font-semibold text-primary">
                                                          {answer.submitted_choices?.join(', ') || 'No answer selected'}
                                                        </span>
                                                      </div>
                                                    }
                                                  >
                                                    <div className="pt-2">
                                                      <RadioGroup
                                                        value={answer.submitted_choices?.[0] || ''}
                                                        isReadOnly
                                                        classNames={{
                                                          wrapper: "gap-3"
                                                        }}
                                                      >
                                                        {answer.original_choices.map((choice: {content: string, isCorrect: boolean}, choiceIndex: number) => {
                                                          const isSelected = answer.submitted_choices?.includes(choice.content)
                                                          const isCorrect = choice.isCorrect
                                                          const showCorrectAnswers = user?.role === 'instructor' || (examSchedule?.show_answer && examSchedule?.allowed_review)

                                                          return (
                                                            <Radio
                                                              key={choiceIndex}
                                                              value={choice.content}
                                                              classNames={{
                                                                base: `max-w-full m-0 p-3 rounded-lg border-2 transition-colors ${showCorrectAnswers
                                                                  ? isSelected
                                                                    ? isCorrect
                                                                      ? 'border-success bg-success/10'
                                                                      : 'border-danger bg-danger/10'
                                                                    : isCorrect
                                                                      ? 'border-success/30 bg-success/5'
                                                                      : 'border-default-200 bg-default-50'
                                                                  : isSelected
                                                                    ? 'border-blue-400 bg-blue-400/10'
                                                                    : 'border-default-200 bg-default-50'
                                                                  }`,
                                                                wrapper: "hidden",
                                                                labelWrapper: "w-full"
                                                              }}
                                                            >
                                                              <div className="flex items-center justify-between w-full">
                                                                <span className="text-sm">{stripHtmlTags(choice.content)}</span>
                                                                <div className="flex items-center gap-2">
                                                                  {isSelected && (
                                                                    <Chip size="sm" className='bg-blue-400/40' variant="flat">
                                                                      Selected
                                                                    </Chip>
                                                                  )}
                                                                  {showCorrectAnswers && isCorrect && (
                                                                    <Chip size="sm" color="success" variant="flat">
                                                                      Correct
                                                                    </Chip>
                                                                  )}
                                                                </div>
                                                              </div>
                                                            </Radio>
                                                          )
                                                        })}
                                                      </RadioGroup>
                                                    </div>
                                                  </AccordionItem>
                                                </Accordion>
                                              ) : answer.question_type === 'nested' ? (
                                                /* Nested Questions */
                                                <div className="space-y-4">
                                                  <div className="text-sm font-medium text-primary mb-3">
                                                    🔗 Nested Questions ({(answer.nested_answers || answer.graded_nested_answers)?.length || 0} sub-questions)
                                                  </div>
                                                  
                                                  {/* Display nested answers */}
                                                  {(answer.graded_nested_answers || answer.nested_answers)?.map((nestedAnswer, nestedIndex) => (
                                                    <div key={nestedAnswer.question_id || nestedIndex} className="ml-4 border-l-2 border-primary/20 pl-4 space-y-2">
                                                      {/* Sub-question header */}
                                                      <div className="flex items-center justify-between">
                                                        <span className="text-sm font-medium text-secondary">
                                                          Sub-question {nestedIndex + 1}
                                                        </span>
                                                        <div className="flex items-center gap-2">
                                                          {nestedAnswer.is_correct !== undefined && (
                                                            <Chip size="sm" variant="flat" color={nestedAnswer.is_correct ? 'success' : 'danger'}>
                                                              {nestedAnswer.is_correct ? 'Correct' : 'Incorrect'}
                                                            </Chip>
                                                          )}
                                                          <span className="text-xs font-medium">
                                                            {nestedAnswer.score_obtained !== undefined
                                                              ? `${nestedAnswer.score_obtained}/${nestedAnswer.max_score} pts`
                                                              : `Max: ${nestedAnswer.max_score} pts`
                                                            }
                                                          </span>
                                                          <Chip size="sm" variant="bordered" color="default">
                                                            {nestedAnswer.question_type.toUpperCase()}
                                                          </Chip>
                                                        </div>
                                                      </div>
                                                      
                                                      {/* Sub-question text */}
                                                      <div className="text-sm text-default-700 font-medium">
                                                        {stripHtmlTags(nestedAnswer.submitted_question)}
                                                      </div>
                                                      
                                                      {/* Sub-question answer - Multiple Choice */}
                                                      {nestedAnswer.question_type === 'mc' && nestedAnswer.original_choices ? (
                                                        <Accordion variant="bordered">
                                                          <AccordionItem
                                                            key="nested-choices"
                                                            aria-label="Sub-question Choices"
                                                            title={
                                                              <div className="flex items-center gap-2">
                                                                <span className="text-sm font-medium">
                                                                  {user?.role === 'instructor' ? "Learner answer:" : "Your answer:"}
                                                                </span>
                                                                <span className="text-sm font-semibold text-primary">
                                                                  {nestedAnswer.submitted_choices?.join(', ') || 'No answer selected'}
                                                                </span>
                                                              </div>
                                                            }
                                                          >
                                                            <div className="pt-2">
                                                              <RadioGroup
                                                                value={nestedAnswer.submitted_choices?.[0] || ''}
                                                                isReadOnly
                                                                classNames={{
                                                                  wrapper: "gap-3"
                                                                }}
                                                              >
                                                                {nestedAnswer.original_choices.map((choice: {content: string, isCorrect: boolean}, choiceIndex: number) => {
                                                                  const isSelected = nestedAnswer.submitted_choices?.includes(choice.content)
                                                                  const isCorrect = choice.isCorrect
                                                                  const showCorrectAnswers = user?.role === 'instructor' || (examSchedule?.show_answer && examSchedule?.allowed_review)

                                                                  return (
                                                                    <Radio
                                                                      key={choiceIndex}
                                                                      value={choice.content}
                                                                      classNames={{
                                                                        base: `max-w-full m-0 p-3 rounded-lg border-2 transition-colors ${showCorrectAnswers
                                                                          ? isSelected
                                                                            ? isCorrect
                                                                              ? 'border-success bg-success/10'
                                                                              : 'border-danger bg-danger/10'
                                                                            : isCorrect
                                                                              ? 'border-success/30 bg-success/5'
                                                                              : 'border-default-200 bg-default-50'
                                                                          : isSelected
                                                                            ? 'border-primary bg-primary/10'
                                                                            : 'border-default-200 bg-default-50'
                                                                        }`,
                                                                        wrapper: "hidden",
                                                                        labelWrapper: "w-full"
                                                                      }}
                                                                    >
                                                                      <div className="flex items-center justify-between w-full">
                                                                        <span className="font-medium text-default-700">
                                                                          {stripHtmlTags(choice.content)}
                                                                        </span>
                                                                        <div className="flex items-center gap-2">
                                                                          {isSelected && (
                                                                            <Chip size="sm" color="primary" variant="flat">
                                                                              Selected
                                                                            </Chip>
                                                                          )}
                                                                          {showCorrectAnswers && isCorrect && (
                                                                            <Chip size="sm" color="success" variant="flat">
                                                                              Correct
                                                                            </Chip>
                                                                          )}
                                                                        </div>
                                                                      </div>
                                                                    </Radio>
                                                                  )
                                                                })}
                                                              </RadioGroup>
                                                            </div>
                                                          </AccordionItem>
                                                        </Accordion>
                                                      ) : (
                                                        /* Non-multiple choice nested answers */
                                                        <div className="bg-default-100 rounded-md p-3">
                                                          <span className="text-default-600 font-medium text-sm">
                                                            {user?.role === 'instructor' ? "Learner answer: " : "Your answer: "}
                                                          </span>
                                                          <span className="font-medium text-default-800">
                                                            {nestedAnswer.question_type === 'tf' && (
                                                              <span className="text-primary">
                                                                {nestedAnswer.submitted_boolean ? 'True' : 'False'}
                                                              </span>
                                                            )}
                                                            {(nestedAnswer.question_type === 'ses' || nestedAnswer.question_type === 'les') && (
                                                              <span className="text-primary">
                                                                {nestedAnswer.submitted_answer || 'No answer provided'}
                                                              </span>
                                                            )}
                                                          </span>
                                                        </div>
                                                      )}
                                                    </div>
                                                  ))}
                                                </div>
                                              ) : (
                                                /* Non-multiple choice, non-nested answers */
                                                <div className="space-y-3">
                                                  <div className="text-sm rounded-md p-3 border border-default-200">
                                                    <span className="text-default-600 font-medium">
                                                    {user?.role === 'instructor' ? "Learner answer:" : "Your answer:"}
                                                    </span>
                                                    <span className="font-medium text-default-800">
                                                      {answer.question_type === 'tf' && (answer.submitted_boolean ? 'True' : 'False')}
                                                      {(answer.question_type === 'ses' || answer.question_type === 'les') && answer.submitted_answer}
                                                    </span>
                                                  </div>
                                                </div>
                                              )}

                                              {/* Expected Answers Section for SES/LES questions */}
                                              {shouldShowExpectedAnswers(answer.question_type) && (() => {
                                                const expectedAnswers = getExpectedAnswers(answer.question_id)
                                                if (expectedAnswers.length === 0) return null

                                                return (
                                                  <div className="mt-4 p-3 rounded-lg">
                                                    <h5 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                                                      📝 Expected Answer{expectedAnswers.length > 1 ? 's' : ''}
                                                      <Chip size="sm" color="primary" variant="flat">
                                                        {expectedAnswers.length} answer{expectedAnswers.length > 1 ? 's' : ''}
                                                      </Chip>
                                                    </h5>
                                                    <div className="space-y-2">
                                                      {expectedAnswers.map((expectedAnswer, index) => (
                                                        <div key={index} className=" p-3 rounded-lg bg-success/10 border border-success ">
                                                          <div className="flex items-center gap-2">
                                                            <span className="text-xs font-medium text-foreground  px-2 py-1 rounded-full min-w-fit">
                                                              {expectedAnswers.length > 1 ? `${index + 1}.` : '✓'}
                                                            </span>
                                                            <div className="text-sm text-foreground flex-1">
                                                              {stripHtmlTags(expectedAnswer)}
                                                            </div>
                                                          </div>
                                                        </div>
                                                      ))}
                                                    </div>
                                                    {user?.role !== 'instructor' && (
                                                      <p className="text-xs text-blue-600 mt-2 italic">
                                                        💡 Compare your answer with the expected answer{expectedAnswers.length > 1 ? 's' : ''} above
                                                      </p>
                                                    )}
                                                  </div>
                                                )
                                              })()}

                                              {/* Manual Grading Section for Instructors */}
                                              {user?.role === 'instructor' && (answer.question_type === 'ses' || answer.question_type === 'les') && (
                                                <div className="bg-default-50 rounded-lg p-3 border border-default-200 mt-3">
                                                  <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                      <span className="text-sm font-medium text-default-700">Manual Grading:</span>
                                                      {answer.score_obtained !== undefined ? (
                                                        <Chip size="sm" color="success" variant="flat">
                                                          ✓ Graded ({answer.score_obtained}/{answer.max_score})
                                                        </Chip>
                                                      ) : (
                                                        <Chip size="sm" color="warning" variant="flat">
                                                          📝 Ungraded
                                                        </Chip>
                                                      )}
                                                    </div>
                                                    <Button
                                                      size="sm"
                                                      color={answer.score_obtained !== undefined ? "secondary" : "primary"}
                                                      variant="bordered"
                                                      onPress={() => handleOpenGradingModal(submission._id, answer.question_id, answer)}
                                                    >
                                                      {answer.score_obtained !== undefined ? "Update Grade" : "Grade Question"}
                                                    </Button>
                                                  </div>
                                                </div>
                                              )}
                                            </div>
                                          )
                                        })}

                                        {/* Pagination Controls */}
                                        <div className="flex justify-between items-center mt-6 pt-4 border-t border-default-200">
                                          <Button
                                            color="default"
                                            variant="bordered"
                                            onPress={() => {
                                              const newPage = Math.max(currentPage - 1, 1)
                                              setSubmissionQuestionPage(submission._id, newPage)
                                            }}
                                            isDisabled={currentPage === 1}
                                          >
                                            Previous
                                          </Button>

                                          <span className="text-sm text-default-600">
                                            Page {currentPage} of {totalPages} ({submission.submitted_answers.length} questions)
                                          </span>

                                          <Button
                                            color="default"
                                            variant="bordered"
                                            onPress={() => {
                                              const newPage = Math.min(currentPage + 1, totalPages)
                                              setSubmissionQuestionPage(submission._id, newPage)
                                            }}
                                            isDisabled={currentPage === totalPages}
                                          >
                                            Next
                                          </Button>
                                        </div>
                                      </>
                                    )
                                  })()}
                                </div>
                              </div>
                            </div>
                          ) : (
                            // Simple view for few questions
                            <div className="space-y-4">
                              {(() => {
                                const filteredAnswers = filterQuestionsByType(submission.submitted_answers)
                                return filteredAnswers.map((answer, answerIndex) => (
                                  <div key={answer.question_id} className="border border-default-200 rounded-lg p-4 bg-default-50">
                                    <div className="flex items-center justify-between mb-3">
                                      <span className="font-medium text-sm text-secondary">Question {answerIndex + 1}</span>
                                      <div className="flex items-center gap-2">
                                        {/* Show correctness status if available */}
                                        {answer.is_correct !== undefined && (
                                          <Chip
                                            size="sm"
                                            variant="flat"
                                            color={answer.is_correct ? 'success' : 'danger'}
                                          >
                                            {answer.is_correct ? 'Correct' : 'Incorrect'}
                                          </Chip>
                                        )}

                                        {/* Show score if available, otherwise show max possible score */}
                                        <span className="text-sm font-medium">
                                          {answer.score_obtained !== undefined
                                            ? `${answer.score_obtained}/${answer.max_score} pts`
                                            : `Max: ${answer.max_score} pts`
                                          }
                                        </span>

                                        {/* Show question type for instructors */}
                                        {user?.role === 'instructor' && (
                                          <Chip size="sm" variant="bordered" color="default">
                                            {answer.question_type.toUpperCase()}
                                          </Chip>
                                        )}
                                      </div>
                                    </div>

                                    {/* Question Text */}
                                    <div
                                      className="text-sm text-default-700 mb-3 font-medium"
                                      dangerouslySetInnerHTML={{ __html: answer.submitted_question }}
                                    />

                                    {/* Answer Section with Accordion */}
                                    {answer.question_type === 'mc' && answer.original_choices ? (
                                      <Accordion variant="bordered">
                                        <AccordionItem
                                          key="choices"
                                          aria-label="Question Choices"
                                          title={
                                            <div className="flex items-center gap-2">
                                              <span className="text-sm font-medium">
                                                {user?.role === 'instructor' ? "Learner answer:" : "Your answer:"}
                                              </span>
                                              <span className="text-sm font-semibold text-primary">
                                                {answer.submitted_choices?.join(', ') || 'No answer selected'}
                                              </span>
                                            </div>
                                          }
                                        >
                                          <div className="pt-2">
                                            <RadioGroup
                                              value={answer.submitted_choices?.[0] || ''}
                                              isReadOnly
                                              classNames={{
                                                wrapper: "gap-3"
                                              }}
                                            >
                                              {answer.original_choices.map((choice: {content: string, isCorrect: boolean}, choiceIndex: number) => {
                                                const isSelected = answer.submitted_choices?.includes(choice.content)
                                                const isCorrect = choice.isCorrect
                                                const showCorrectAnswers = user?.role === 'instructor' || (examSchedule?.show_answer && examSchedule?.allowed_review)

                                                return (
                                                  <Radio
                                                    key={choiceIndex}
                                                    value={choice.content}
                                                    classNames={{
                                                      base: `max-w-full m-0 p-3 rounded-lg border-2 transition-colors ${showCorrectAnswers
                                                        ? isSelected
                                                          ? isCorrect
                                                            ? 'border-success bg-success/10'
                                                            : 'border-danger bg-danger/10'
                                                          : isCorrect
                                                            ? 'border-success/30 bg-success/5'
                                                            : 'border-default-200 bg-default-50'
                                                        : isSelected
                                                          ? 'border-blue-400 bg-blue-400/10'
                                                          : 'border-default-200 bg-default-50'
                                                        }`,
                                                      wrapper: "hidden",
                                                      labelWrapper: "w-full"
                                                    }}
                                                  >
                                                    <div className="flex items-center justify-between w-full">
                                                      <span className="text-sm">{choice.content}</span>
                                                      <div className="flex items-center gap-2">
                                                        {isSelected && (
                                                          <Chip size="sm" className='bg-blue-400/40' variant="flat">
                                                            Selected
                                                          </Chip>
                                                        )}
                                                        {showCorrectAnswers && isCorrect && (
                                                          <Chip size="sm" color="success" variant="flat">
                                                            Correct
                                                          </Chip>
                                                        )}
                                                      </div>
                                                    </div>
                                                  </Radio>
                                                )
                                              })}
                                            </RadioGroup>
                                          </div>
                                        </AccordionItem>
                                      </Accordion>
                                    ) : answer.question_type === 'nested' ? (
                                      /* Nested Questions */
                                      <div className="space-y-4">
                                        <div className="text-sm font-medium text-primary mb-3">
                                          🔗 Nested Questions ({(answer.nested_answers || answer.graded_nested_answers)?.length || 0} sub-questions)
                                        </div>
                                        
                                        {/* Display nested answers */}
                                        {(answer.graded_nested_answers || answer.nested_answers)?.map((nestedAnswer, nestedIndex) => (
                                          <div key={nestedAnswer.question_id || nestedIndex} className="ml-4 border-l-2 border-primary/20 pl-4 space-y-2">
                                            {/* Sub-question header */}
                                            <div className="flex items-center justify-between">
                                              <span className="text-sm font-medium text-secondary">
                                                Sub-question {nestedIndex + 1}
                                              </span>
                                              <div className="flex items-center gap-2">
                                                {nestedAnswer.is_correct !== undefined && (
                                                  <Chip size="sm" variant="flat" color={nestedAnswer.is_correct ? 'success' : 'danger'}>
                                                    {nestedAnswer.is_correct ? 'Correct' : 'Incorrect'}
                                                  </Chip>
                                                )}
                                                <span className="text-xs font-medium">
                                                  {nestedAnswer.score_obtained !== undefined
                                                    ? `${nestedAnswer.score_obtained}/${nestedAnswer.max_score} pts`
                                                    : `Max: ${nestedAnswer.max_score} pts`
                                                  }
                                                </span>
                                                <Chip size="sm" variant="bordered" color="default">
                                                  {nestedAnswer.question_type.toUpperCase()}
                                                </Chip>
                                              </div>
                                            </div>
                                            
                                            {/* Sub-question text */}
                                            <div className="text-sm text-default-700 font-medium" dangerouslySetInnerHTML={{ __html: nestedAnswer.submitted_question }} />
                                            
                                            {/* Sub-question answer - Multiple Choice */}
                                            {nestedAnswer.question_type === 'mc' && nestedAnswer.original_choices ? (
                                              <Accordion variant="bordered">
                                                <AccordionItem
                                                  key="nested-choices"
                                                  aria-label="Sub-question Choices"
                                                  title={
                                                    <div className="flex items-center gap-2">
                                                      <span className="text-sm font-medium">
                                                        {user?.role === 'instructor' ? "Learner answer:" : "Your answer:"}
                                                      </span>
                                                      <span className="text-sm font-semibold text-primary">
                                                        {nestedAnswer.submitted_choices?.join(', ') || 'No answer selected'}
                                                      </span>
                                                    </div>
                                                  }
                                                >
                                                  <div className="pt-2">
                                                    <RadioGroup
                                                      value={nestedAnswer.submitted_choices?.[0] || ''}
                                                      isReadOnly
                                                      classNames={{
                                                        wrapper: "gap-3"
                                                      }}
                                                    >
                                                      {nestedAnswer.original_choices.map((choice: {content: string, isCorrect: boolean}, choiceIndex: number) => {
                                                        const isSelected = nestedAnswer.submitted_choices?.includes(choice.content)
                                                        const isCorrect = choice.isCorrect
                                                        const showCorrectAnswers = user?.role === 'instructor' || (examSchedule?.show_answer && examSchedule?.allowed_review)

                                                        return (
                                                          <Radio
                                                            key={choiceIndex}
                                                            value={choice.content}
                                                            classNames={{
                                                              base: `max-w-full m-0 p-3 rounded-lg border-2 transition-colors ${showCorrectAnswers
                                                                ? isSelected
                                                                  ? isCorrect
                                                                    ? 'border-success bg-success/10'
                                                                    : 'border-danger bg-danger/10'
                                                                  : isCorrect
                                                                    ? 'border-success/30 bg-success/5'
                                                                    : 'border-default-200 bg-default-50'
                                                                : isSelected
                                                                  ? 'border-primary bg-primary/10'
                                                                  : 'border-default-200 bg-default-50'
                                                              }`,
                                                              wrapper: "hidden",
                                                              labelWrapper: "w-full"
                                                            }}
                                                          >
                                                            <div className="flex items-center justify-between w-full">
                                                              <span className="font-medium text-default-700">
                                                                {choice.content}
                                                              </span>
                                                              <div className="flex items-center gap-2">
                                                                {isSelected && (
                                                                  <Chip size="sm" color="primary" variant="flat">
                                                                    Selected
                                                                  </Chip>
                                                                )}
                                                                {showCorrectAnswers && isCorrect && (
                                                                  <Chip size="sm" color="success" variant="flat">
                                                                    Correct
                                                                  </Chip>
                                                                )}
                                                              </div>
                                                            </div>
                                                          </Radio>
                                                        )
                                                      })}
                                                    </RadioGroup>
                                                  </div>
                                                </AccordionItem>
                                              </Accordion>
                                            ) : (
                                              /* Non-multiple choice nested answers */
                                              <div className="bg-default-100 rounded-md p-3">
                                                <span className="text-default-600 font-medium text-sm">
                                                  {user?.role === 'instructor' ? "Learner answer: " : "Your answer: "}
                                                </span>
                                                <span className="font-medium text-default-800">
                                                  {nestedAnswer.question_type === 'tf' && (
                                                    <span className="text-primary">
                                                      {nestedAnswer.submitted_boolean ? 'True' : 'False'}
                                                    </span>
                                                  )}
                                                  {(nestedAnswer.question_type === 'ses' || nestedAnswer.question_type === 'les') && (
                                                    <span className="text-primary">
                                                      {nestedAnswer.submitted_answer || 'No answer provided'}
                                                    </span>
                                                  )}
                                                </span>
                                              </div>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      /* Non-multiple choice, non-nested answers */
                                      <div className="space-y-3">
                                        <div className="text-sm rounded-md p-3 border border-default-200">
                                          <span className="text-default-600 font-medium">
                                            {user?.role === 'instructor' ? "Learner answer:" : "Your answer:"}
                                          </span>
                                          <span className="font-medium text-default-800">
                                            {answer.question_type === 'tf' && (answer.submitted_boolean ? 'True' : 'False')}
                                            {(answer.question_type === 'ses' || answer.question_type === 'les') && answer.submitted_answer}
                                          </span>
                                        </div>
                                        {/* Expected Answers Section for SES/LES questions */}
                                        {shouldShowExpectedAnswers(answer.question_type) && (() => {
                                          const expectedAnswers = getExpectedAnswers(answer.question_id)
                                          if (expectedAnswers.length === 0) return null

                                          return (
                                            <div className="mt-4 p-3 rounded-lg">
                                              <h5 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                                                📝 Expected Answer{expectedAnswers.length > 1 ? 's' : ''}
                                                <Chip size="sm" color="primary" variant="flat">
                                                  {expectedAnswers.length} answer{expectedAnswers.length > 1 ? 's' : ''}
                                                </Chip>
                                              </h5>
                                              <div className="space-y-2">
                                                {expectedAnswers.map((expectedAnswer, index) => (
                                                  <div key={index} className=" p-3 rounded-lg bg-success/10 border border-success ">
                                                    <div className="flex items-center gap-2">
                                                      <span className="text-xs font-medium text-foreground px-2 py-1 rounded-full min-w-fit">
                                                        {expectedAnswers.length > 1 ? `${index + 1}.` : '✓'}
                                                      </span>
                                                      <div
                                                        className="text-sm text-foreground flex-1"
                                                        dangerouslySetInnerHTML={{ __html: expectedAnswer }}
                                                      />
                                                    </div>
                                                  </div>
                                                ))}
                                              </div>
                                              {user?.role !== 'instructor' && (
                                                <p className="text-xs text-blue-600 mt-2 italic">
                                                  💡 Compare your answer with the expected answer{expectedAnswers.length > 1 ? 's' : ''} above
                                                </p>
                                              )}
                                            </div>
                                          )
                                        })()}

                                        {/* Manual Grading Section for Instructors */}
                                        {user?.role === 'instructor' && (answer.question_type === 'ses' || answer.question_type === 'les') && (
                                          <div className="bg-default-50 rounded-lg p-3 border border-default-200 mt-3">
                                            <div className="flex items-center justify-between">
                                              <div className="flex items-center gap-2">
                                                <span className="text-sm font-medium text-default-700">Manual Grading:</span>
                                                {answer.score_obtained !== undefined ? (
                                                  <Chip size="sm" color="success" variant="flat">
                                                    ✓ Graded ({answer.score_obtained}/{answer.max_score})
                                                  </Chip>
                                                ) : (
                                                  <Chip size="sm" color="warning" variant="flat">
                                                    📝 Ungraded
                                                  </Chip>
                                                )}
                                              </div>
                                              <Button
                                                size="sm"
                                                color={answer.score_obtained !== undefined ? "secondary" : "primary"}
                                                variant="bordered"
                                                onPress={() => handleOpenGradingModal(submission._id, answer.question_id, answer)}
                                              >
                                                {answer.score_obtained !== undefined ? "Update Grade" : "Grade Question"}
                                              </Button>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                ))
                              })()}
                            </div>
                          )}
                        </div>
                      )}
                    </CardBody>
                  )}
                </Card>
              )
            })
          )}
        </div>

        {/* Questions are now displayed inline in each submission card */}
      </div>

      {/* Manual Grading Modal */}
      <Modal
        isOpen={isGradingModalOpen}
        onOpenChange={onGradingModalOpenChange}
        size="md"
        backdrop="blur"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold">Manual Grading</span>
                  <Chip size="sm" color="primary" variant="flat">
                    {gradingQuestion?.answer.question_type === 'ses' ? 'Short Essay' : 'Long Essay'}
                  </Chip>
                </div>
              </ModalHeader>
              <ModalBody>
                {gradingQuestion && (
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-default-700 mb-2">Question:</h4>
                      <div
                        className="text-sm text-default-600 bg-default-50 p-3 rounded-lg border"
                        dangerouslySetInnerHTML={{ __html: gradingQuestion.answer.submitted_question }}
                      />
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-default-700 mb-2">Learner Answer:</h4>
                      <div className="text-sm text-default-800 bg-default-50 p-3 rounded-lg border min-h-[80px]">
                        {gradingQuestion.answer.submitted_answer || 'No answer provided'}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-default-700 mb-2">
                        Score (0 - {gradingQuestion.answer.max_score} points):
                      </h4>
                      <Input
                        type="number"
                        placeholder="Enter score"
                        value={gradingScore}
                        onChange={(e) => setGradingScore(e.target.value)}
                        min={0}
                        max={gradingQuestion.answer.max_score}
                        step={0.5}
                        endContent={
                          <span className="text-sm text-default-400">/ {gradingQuestion.answer.max_score}</span>
                        }
                      />
                    </div>

                    {/* AI Assistant Section - Only for essay questions */}
                    {gradingQuestion && ['ses', 'les'].includes(gradingQuestion.answer.question_type) && (
                      <div className="border border-primary/20 rounded-lg p-4 bg-primary/5">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-medium text-primary-700 flex items-center gap-2">
                            🤖 AI Grading Assistant
                            <Chip size="sm" color="primary" variant="dot">
                              Beta
                            </Chip>
                          </h4>
                          <Button
                            size="sm"
                            color="primary"
                            variant="bordered"
                            onPress={handleGetAiSuggestion}
                            isLoading={isAiLoading}
                            isDisabled={isGradingLoading}
                          >
                            {isAiLoading ? 'Analyzing...' : 'Get AI Suggestion'}
                          </Button>
                        </div>

                        {showAiSuggestion && aiSuggestion && (
                          <div className=" rounded-lg p-3 border border-primary/30 max-h-60 overflow-y-auto">
                            <div className="text-xs text-primary-600 mb-2 font-medium">
                              AI Grading Suggestion:
                            </div>
                            <div className="text-sm text-default-800 whitespace-pre-wrap">
                              {aiSuggestion}
                            </div>
                          </div>
                        )}

                        <div className="text-xs text-primary-600 mt-2">
                          💡 AI suggestions are for guidance only. Use your professional judgment for final grading.
                        </div>
                      </div>
                    )}

                    <div className="text-xs text-default-500">
                      💡 Tip: Enter 0 for incorrect answers, or any value between 0 and {gradingQuestion.answer.max_score} for partial/full credit.
                    </div>
                  </div>
                )}
              </ModalBody>
              <ModalFooter>
                <Button
                  color="danger"
                  variant="light"
                  onPress={onClose}
                  isDisabled={isGradingLoading}
                >
                  Cancel
                </Button>
                <Button
                  color="secondary"
                  onPress={handleManualGrade}
                  isLoading={isGradingLoading}
                >
                  Save Grade
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  )
}

export default SubmissionHistoryPage
