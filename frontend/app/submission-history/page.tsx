"use client"

import React, { useEffect, useState, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { clientAPI } from '@/config/axios.config'
import { Card, CardBody, CardHeader, Divider, Spinner, Chip, Button } from '@nextui-org/react'
import { ArrowLeft, FileDocument, Clock, CheckCircle, CloseCircle } from '@/components/icons/icons'
import { useUserStore } from '@/stores/user.store'
import { toast } from 'react-toastify'

interface SubmittedAnswer {
  question_id: string
  submitted_question: string
  question_type: 'mc' | 'tf' | 'ses' | 'les' | 'nested'
  submitted_choices?: string[]
  submitted_answer?: string
  submitted_boolean?: boolean
  is_correct?: boolean
  score_obtained?: number
  max_score: number
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
}

interface ExamSchedule {
  _id: string
  title: string
  description?: string
  allowed_attempts: number
  allowed_review: boolean
  show_answer: boolean
}

const SubmissionHistoryPage = () => {
  const params = useSearchParams()
  const schedule_id = params.get('schedule_id')
  const student_id = params.get('student_id')
  const { user } = useUserStore()
  const router = useRouter()
  
  const [submissions, setSubmissions] = useState<ExamSubmission[]>([])
  const [examSchedule, setExamSchedule] = useState<ExamSchedule | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentQuestionPage, setCurrentQuestionPage] = useState<{[submissionId: string]: number}>({})
  const questionsPerPage = 5

  // Validate access and fetch data
  useEffect(() => {
    const fetchData = async () => {
      if (!schedule_id || !student_id || !user) {
        toast.error('Missing required parameters')
        router.push('/overview')
        return
      }

      // Validate that the current user can view this submission history
      if (user._id !== student_id && user.role !== 'instructor') {
        toast.error('You do not have permission to view this submission history')
        router.push('/overview')
        return
      }

      try {
        // Fetch exam schedule details
        const scheduleResponse = await clientAPI.get(`/exam-schedule/${schedule_id}`)
        if (scheduleResponse.data.code === 200) {
          setExamSchedule(scheduleResponse.data.data)
        }

        // Fetch submissions for this schedule and student
        const submissionsResponse = await clientAPI.get(`/submission/schedule/${schedule_id}`)
        if (submissionsResponse.data.success) {
          // Filter submissions for the specific student
          const studentSubmissions = submissionsResponse.data.data.filter(
            (submission: ExamSubmission) => submission.student_id === student_id
          )
          setSubmissions(studentSubmissions.sort((a: ExamSubmission, b: ExamSubmission) => b.attempt_number - a.attempt_number))
        }
      } catch (error) {
        console.error('Error fetching submission history:', error)
        toast.error('Failed to load submission history')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [schedule_id, student_id, user, router])

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-default-50 to-primary/10 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Spinner size="lg" color="primary" />
              <p className="mt-4 text-default-600">Loading submission history...</p>
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
                  Submission History
                </h1>
                <p className="text-default-600">
                  {examSchedule?.title || 'Exam Schedule'}
                </p>
              </div>
            </div>

            {/* Statistics */}
            {statistics && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-background/50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-secondary">{statistics.totalAttempts}</div>
                  <div className="text-sm text-default-600">Total Attempts</div>
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
                  <div className="text-sm text-default-600">Best Score</div>
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
                <p className="text-default-500">You haven't submitted this exam yet.</p>
              </CardBody>
            </Card>
          ) : (
            submissions.map((submission, index) => {
              const submissionDateTime = formatDateTime(submission.submission_time)
              const gradedDateTime = submission.graded_at ? formatDateTime(submission.graded_at) : null
              
              return (
                <Card key={submission._id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg flex items-center justify-center">
                          <span className="font-bold text-primary">#{submission.attempt_number}</span>
                        </div>
                        <div>
                          <h3 className="font-semibold">Attempt {submission.attempt_number}</h3>
                          <p className="text-sm text-default-600">
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
                        {/* Questions are now displayed inline below */}
                      </div>
                    </div>
                  </CardHeader>
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
                              {submission.total_score}/{submission.max_possible_score} ({submission.percentage_score?.toFixed(1)}%)
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
                    {((examSchedule?.show_answer && submission.is_graded) || user?.role === 'instructor') && (
                      <div className="mt-6">
                        <Divider className="mb-4" />
                        <h4 className="font-semibold mb-4 text-lg">
                          {user?.role === 'instructor' ? 'Student Submission Review' : 'Answer Review'}
                        </h4>
                        
                        {submission.submitted_answers.length > questionsPerPage ? (
                          // Paginated view for many questions
                          <div className="flex gap-6">
                            {/* Question Navigation Sidebar */}
                            <Card className="w-1/3 h-fit sticky top-4">
                              <CardBody className="px-4 py-4">
                                <div className="flex flex-col gap-4">
                                  <div className="flex justify-between items-center">
                                    <h3 className="text-md font-semibold">Questions Navigation</h3>
                                    <span className="text-sm text-default-600">
                                      {submission.submitted_answers.length} questions
                                    </span>
                                  </div>
                                  
                                  <div className="grid grid-cols-5 gap-2">
                                    {submission.submitted_answers.map((answer, index) => {
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
                                    const { currentPage, totalPages } = getCurrentQuestions(submission)
                                    return (
                                      <p className="text-sm text-default-500">
                                        Page {currentPage} of {totalPages}
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
                                  const { questions, startIndex, currentPage, totalPages } = getCurrentQuestions(submission)
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
                                            <p className="text-sm text-default-700 mb-3 font-medium">{answer.submitted_question}</p>
                                            
                                            {/* Student Answer */}
                                            <div className="text-sm bg-white rounded-md p-3 border border-default-200">
                                              <span className="text-default-600 font-medium">
                                                {user?.role === 'instructor' ? 'Student answer: ' : 'Your answer: '}
                                              </span>
                                              <span className="font-medium text-default-800">
                                                {answer.question_type === 'mc' && answer.submitted_choices?.join(', ')}
                                                {answer.question_type === 'tf' && (answer.submitted_boolean ? 'True' : 'False')}
                                                {(answer.question_type === 'ses' || answer.question_type === 'les') && answer.submitted_answer}
                                              </span>
                                            </div>
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
                            {submission.submitted_answers.map((answer, answerIndex) => (
                              <div key={answer.question_id} className="border border-default-200 rounded-lg p-4 bg-default-50">
                                <div className="flex items-center justify-between mb-3">
                                  <span className="font-medium text-sm text-primary">Question {answerIndex + 1}</span>
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
                                <p className="text-sm text-default-700 mb-3 font-medium">{answer.submitted_question}</p>
                                
                                {/* Student Answer */}
                                <div className="text-sm bg-white rounded-md p-3 border border-default-200">
                                  <span className="text-default-600 font-medium">
                                    {user?.role === 'instructor' ? 'Student answer: ' : 'Your answer: '}
                                  </span>
                                  <span className="font-medium text-default-800">
                                    {answer.question_type === 'mc' && answer.submitted_choices?.join(', ')}
                                    {answer.question_type === 'tf' && (answer.submitted_boolean ? 'True' : 'False')}
                                    {(answer.question_type === 'ses' || answer.question_type === 'les') && answer.submitted_answer}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </CardBody>
                </Card>
              )
            })
          )}
        </div>

        {/* Questions are now displayed inline in each submission card */}
      </div>
    </div>
  )
}

export default SubmissionHistoryPage
