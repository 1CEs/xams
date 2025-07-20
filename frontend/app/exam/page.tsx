"use client"

import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { clientAPI } from '@/config/axios.config'
import { errorHandler } from '@/utils/error'
import { Card, CardBody, CardHeader, Divider, Spinner, Button, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@nextui-org/react'
import { HealthiconsIExamMultipleChoice } from '@/components/icons/icons'
import QuestionNavigation from '@/components/exam/QuestionNavigation'
import QuestionCard from '@/components/exam/QuestionCard'
import ExamResultsModal from '@/components/exam/ExamResultsModal'
import ExamTimer from '@/components/exam/ExamTimer'
import { useUserStore } from '@/stores/user.store'
import { toast } from 'react-toastify'

interface Question {
  _id: string
  question: string
  type: 'mc' | 'tf' | 'ses' | 'les' | 'nested'
  choices?: {
    content: string
    isCorrect: boolean
    score: number
  }[]
  isMultiAnswer?: boolean
  isTrue?: boolean
  expectedAnswer?: string
  maxWords?: number
  score: number
  isRandomChoices?: boolean
  questions?: Question[] // For nested questions
}

interface ExamResponse {
  _id: string
  title: string
  description: string
  questions: Question[]
}

interface Answer {
  questionId: string
  answers: string[]
  essayAnswer?: string
}

interface ExamResult {
  totalScore: number
  obtainedScore: number
  correctAnswers: number
  totalQuestions: number
  details: {
    questionId: string
    isCorrect: boolean
    userAnswer: string[]
    correctAnswer: string[]
    score: number
  }[]
}

const ExaminationPage = () => {
  const params = useSearchParams()
  const schedule_id = params.get('schedule_id')
  const { user } = useUserStore()
  const router = useRouter()
  
  const [exam, setExam] = useState<ExamResponse | null>(null)
  const [setting, setSetting] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [validatingAccess, setValidatingAccess] = useState(true)
  const [answers, setAnswers] = useState<Answer[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [isTimeoutModalOpen, setIsTimeoutModalOpen] = useState(false)
  const [isResultsModalOpen, setIsResultsModalOpen] = useState(false)
  const [examResult, setExamResult] = useState<ExamResult | null>(null)
  const [examLoaded, setExamLoaded] = useState(false)
  const questionsPerPage = 5

  // Calculate initial time based on exam settings
  const initialTime = useMemo(() => {
    if (!setting?.close_time) return 60 * 60; // Default to 1 hour if no setting
    const now = new Date();
    const closeTime = new Date(setting.close_time);
    const diffInSeconds = Math.floor((closeTime.getTime() - now.getTime()) / 1000);
    return Math.max(diffInSeconds, 0); // Ensure non-negative time
  }, [setting?.close_time]);

  // Load saved answers and current page from localStorage on component mount
  useEffect(() => {
    if (exam?._id) {
      // Load saved answers
      const savedAnswers = localStorage.getItem(`exam_answers_${exam._id}`)
      if (savedAnswers) {
        setAnswers(JSON.parse(savedAnswers))
      }
      
      // Load saved current page
      const savedPage = localStorage.getItem(`exam_page_${exam._id}`)
      if (savedPage) {
        setCurrentPage(parseInt(savedPage, 10))
      }
    }
  }, [exam?._id])

  // Save answers to localStorage whenever they change
  useEffect(() => {
    if (exam?._id && answers.length > 0) {
      localStorage.setItem(`exam_answers_${exam._id}`, JSON.stringify(answers))
    }
  }, [answers, exam?._id])
  
  // Save current page to localStorage whenever it changes
  useEffect(() => {
    if (exam?._id) {
      localStorage.setItem(`exam_page_${exam._id}`, currentPage.toString())
    }
  }, [currentPage, exam?._id])

  // Validate user access to exam (students and instructors)
  const validateStudentAccess = useCallback(async () => {
    if (!user || !schedule_id) {
      toast.error('Missing user information or schedule ID')
      router.push('/overview')
      return false
    }

    try {
      const response = await clientAPI.get(`/course/validate-exam-access/${user._id}/${schedule_id}`)
      
      if (response.data.code === 200 && response.data.data.hasAccess) {
        const accessData = response.data.data
        console.log('User has access to exam:', accessData)
        
        // Show different messages based on access type
        if (accessData.accessType === 'instructor') {
          console.log('Instructor accessing their own exam schedule')
        } else if (accessData.accessType === 'student') {
          console.log(`Student accessing exam via group: ${accessData.groupName} in course: ${accessData.courseName}`)
        }
        
        return true
      } else {
        const errorMessage = user.role === 'instructor' 
          ? 'You do not have access to this exam schedule. Only the creator can access it.'
          : 'You do not have access to this exam. Please contact your instructor.'
        toast.error(errorMessage)
        router.push('/overview')
        return false
      }
    } catch (error: any) {
      console.error('Error validating exam access:', error)
      toast.error('Failed to validate exam access. Please try again.')
      router.push('/overview')
      return false
    }
  }, [user, schedule_id, router])

  // Validate attempt eligibility for students
  const validateAttemptEligibility = useCallback(async (allowedAttempts: number) => {
    if (!user || !schedule_id) {
      return false
    }

    // Skip validation for instructors
    if (user.role === 'instructor') {
      return true
    }

    try {
      console.log('Validating attempt eligibility...')
      const response = await clientAPI.post('/submission/can-attempt', {
        schedule_id: schedule_id,
        student_id: user._id,
        allowed_attempts: allowedAttempts
      })

      if (response.data.success && response.data.data.canAttempt) {
        console.log('Student can attempt the exam')
        return true
      } else {
        toast.error(`You have reached the maximum number of attempts (${allowedAttempts}) for this exam`)
        setTimeout(() => {
          router.push('/overview')
        }, 2000)
        return false
      }
    } catch (error) {
      console.error('Error validating attempt eligibility:', error)
      toast.error('Failed to validate exam attempt eligibility')
      setTimeout(() => {
        router.push('/overview')
      }, 2000)
      return false
    }
  }, [user, schedule_id, router])

  // Clear localStorage after successful submission
  const clearSavedAnswers = useCallback(() => {
    if (exam?._id) {
      localStorage.removeItem(`exam_answers_${exam._id}`)
      localStorage.removeItem(`exam_page_${exam._id}`) // Also clear saved page
      // Also clear randomized choices from localStorage
      if (exam) {
        exam.questions.forEach(question => {
          if (question.isRandomChoices) {
            localStorage.removeItem(`exam_${exam._id}_randomized_choices_${question._id}`)
            // Also check for schedule-based storage
            if (schedule_id) {
              localStorage.removeItem(`exam_${schedule_id}_randomized_choices_${question._id}`)
            }
          }
          // Also clear for nested questions
          if (question.type === 'nested' && question.questions) {
            question.questions.forEach(subQuestion => {
              if (subQuestion.isRandomChoices) {
                localStorage.removeItem(`exam_${exam._id}_randomized_choices_${subQuestion._id}`)
                // Also check for schedule-based storage
                if (schedule_id) {
                  localStorage.removeItem(`exam_${schedule_id}_randomized_choices_${subQuestion._id}`)
                }
              }
            })
          }
        })
      }
    }
  }, [exam, schedule_id])

  // Memoize computed values
  const totalPages = useMemo(() => 
    Math.ceil((exam?.questions.length || 0) / questionsPerPage), 
    [exam?.questions.length, questionsPerPage]
  )
  
  const startIndex = useMemo(() => 
    (currentPage - 1) * questionsPerPage, 
    [currentPage, questionsPerPage]
  )
  
  const endIndex = useMemo(() => 
    startIndex + questionsPerPage, 
    [startIndex, questionsPerPage]
  )
  
  const currentQuestions = useMemo(() => 
    exam?.questions.slice(startIndex, endIndex) || [], 
    [exam?.questions, startIndex, endIndex]
  )

  useEffect(() => {
    const fetchExam = async () => {
      try {
        // First validate student access
        const hasAccess = await validateStudentAccess()
        if (!hasAccess) {
          setValidatingAccess(false)
          setLoading(false)
          return
        }
        
        setValidatingAccess(false)
        
        let examData: ExamResponse | null = null
        const scheduleResponse = await clientAPI.get(`/exam-schedule/${schedule_id}`)
        if (scheduleResponse.data.code === 200) {
          const scheduleData = scheduleResponse.data.data
          setSetting(scheduleData)
          
          // Check if current time is within exam period
          const now = new Date()
          const openTime = new Date(scheduleData.open_time)
          const closeTime = new Date(scheduleData.close_time)
          
          if (now < openTime || now > closeTime) {
            // Exam is not available, redirect to overview page
            router.push(`/overview`)
            return
          }
          
          // Validate attempt eligibility for students
          const canAttempt = await validateAttemptEligibility(scheduleData.allowed_attempts)
          if (!canAttempt) {
            setLoading(false)
            return
          }
          
          // The scheduleData is now the exam schedule directly
          examData = scheduleData
        }

        // Load saved answers from localStorage
        const savedAnswers = localStorage.getItem(`exam_answers_${schedule_id}`)

        // Initialize answers for all questions including sub-questions
        let initialAnswers: Answer[] = []

        const initializeAnswers = (questions: Question[]) => {
          questions.forEach((q) => {
            if (q.type === 'nested' && q.questions) {
              // Add answers for sub-questions
              q.questions.forEach((subQ) => {
                initialAnswers.push({
                  questionId: subQ._id,
                  answers: [],
                  essayAnswer: ''
                })
              })
            } else {
              // Add answer for regular question
              initialAnswers.push({
                questionId: q._id,
                answers: [],
                essayAnswer: ''
              })
            }
          })
        }

        if (examData) {
          initializeAnswers(examData.questions || [])
        }

        // If there are saved answers, merge them with the initial answers
        if (savedAnswers) {
          const parsedSavedAnswers = JSON.parse(savedAnswers)
          initialAnswers = initialAnswers.map((answer: Answer) => {
            const savedAnswer = parsedSavedAnswers.find((sa: Answer) => sa.questionId === answer.questionId)
            return savedAnswer || answer
          })
        }

        // Ensure randomized choices are properly synchronized with saved answers
        if (examData && schedule_id) {
          const ensureRandomizedChoices = (questions: Question[]) => {
            questions.forEach(q => {
              if (q.isRandomChoices && q.choices) {
                // Check if randomized choices exist in localStorage
                const storedRandomizedChoices = localStorage.getItem(`exam_${schedule_id}_randomized_choices_${q._id}`);
                
                // If not, create and store them
                if (!storedRandomizedChoices) {
                  const shuffledChoices = [...q.choices].sort(() => Math.random() - 0.5);
                  localStorage.setItem(`exam_${schedule_id}_randomized_choices_${q._id}`, JSON.stringify(shuffledChoices));
                }
              }
              
              // Also check nested questions
              if (q.type === 'nested' && q.questions) {
                ensureRandomizedChoices(q.questions);
              }
            });
          };
          
          ensureRandomizedChoices(examData.questions);
        }

        setExam(examData)
        setAnswers(initialAnswers)
        setExamLoaded(true)
      } catch (error) {
        errorHandler(error)
      } finally {
        setLoading(false)
      }
    }

    if (schedule_id && !examLoaded) {
      fetchExam()
    }
  }, [schedule_id, examLoaded, router, validateStudentAccess, validateAttemptEligibility])

  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true)
    try {
      if (!exam || !setting || !user) {
        throw new Error('Missing required data for submission')
      }

      // Transform answers to the new submission format
      const submittedAnswers = answers.map(answer => {
        const question = exam.questions.find(q => q._id === answer.questionId)
        if (!question) {
          throw new Error(`Question not found: ${answer.questionId}`)
        }

        const submittedAnswer: any = {
          question_id: answer.questionId,
          submitted_question: question.question,
          question_type: question.type,
          max_score: question.score
        }

        // Add type-specific answer data
        switch (question.type) {
          case 'mc': // Multiple Choice
            submittedAnswer.submitted_choices = answer.answers
            break
          case 'tf': // True/False
            submittedAnswer.submitted_boolean = answer.answers[0] === 'true'
            break
          case 'ses': // Short Essay
          case 'les': // Long Essay
            submittedAnswer.submitted_answer = answer.essayAnswer || ''
            break
          case 'nested': // Nested questions
            // For nested questions, we might need to handle sub-questions differently
            // For now, treat as essay
            submittedAnswer.submitted_answer = answer.essayAnswer || ''
            break
        }

        return submittedAnswer
      })

      // Calculate time taken (if we have start time)
      const timeTaken = setting.open_time ? 
        Math.floor((new Date().getTime() - new Date(setting.open_time).getTime()) / 1000) : 
        undefined

      // Get course and group info from validation response
      const validationResponse = await clientAPI.get(`/course/validate-exam-access/${user._id}/${schedule_id}`)
      const { courseId, groupId } = validationResponse.data.data || {}

      const submissionData = {
        schedule_id: schedule_id!,
        student_id: user._id,
        course_id: courseId || '',
        group_id: groupId || '',
        submitted_answers: submittedAnswers,
        time_taken: timeTaken
      }

      const res = await clientAPI.post(`/submission`, submissionData)
      
      if (res.data.success) {
        // Transform the submission result to match the expected ExamResult format
        const submission = res.data.data
        const examResult: ExamResult = {
          totalScore: submission.max_possible_score || 0,
          obtainedScore: submission.total_score || 0,
          correctAnswers: submission.submitted_answers?.filter((a: any) => a.is_correct).length || 0,
          totalQuestions: submission.submitted_answers?.length || 0,
          details: submission.submitted_answers?.map((answer: any) => ({
            questionId: answer.question_id,
            isCorrect: answer.is_correct || false,
            userAnswer: answer.submitted_choices || [answer.submitted_answer || String(answer.submitted_boolean)],
            correctAnswer: [], // Will be populated by backend if needed
            score: answer.score_obtained || 0
          })) || []
        }
        
        setExamResult(examResult)
        setIsResultsModalOpen(true)
        clearSavedAnswers()
        toast.success('Exam submitted successfully!')
      } else {
        throw new Error(res.data.message || 'Failed to submit exam')
      }
    } catch (error) {
      console.error('Submission error:', error)
      errorHandler(error)
    } finally {
      setIsSubmitting(false)
    }
  }, [answers, exam, setting, user, schedule_id, clearSavedAnswers])

  const handleQuestionNavigation = useCallback((questionIndex: number, questionId: string) => {
    const targetPage = Math.ceil((questionIndex + 1) / questionsPerPage)
    if (currentPage !== targetPage) {
      setCurrentPage(targetPage)
    }
    setTimeout(() => {
      const questionElement = document.getElementById(`question-${questionId}`)
      if (questionElement) {
        const headerOffset = 100
        const elementPosition = questionElement.getBoundingClientRect().top
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        })
      }
    }, 100)
  }, [currentPage, questionsPerPage])

  const handleTimeout = useCallback(() => {
    setHasSubmitted(true)
    setIsTimeoutModalOpen(true)
  }, [])

  const handleTimeoutSubmit = useCallback(() => {
    setIsTimeoutModalOpen(false)
    handleSubmit()
  }, [handleSubmit])

  const handleResultsClose = useCallback(() => {
    setIsResultsModalOpen(false)
    clearSavedAnswers()
    router.push(`/overview`)
  }, [clearSavedAnswers, router])

  const isQuestionAnswered = useCallback((questionId: string): boolean => {
    const answer = answers.find(a => a.questionId === questionId)
    if (!answer) return false

    const mainQuestion = exam?.questions.find(q => q._id === questionId)
    if (mainQuestion) {
      if (mainQuestion.type === 'ses' || mainQuestion.type === 'les') {
        return Boolean(answer.essayAnswer && answer.essayAnswer.trim() !== '')
      }
      return Boolean(answer.answers && answer.answers.length > 0)
    }

    for (const question of exam?.questions || []) {
      if (question.type === 'nested' && question.questions) {
        const nestedQuestion = question.questions.find(q => q._id === questionId)
        if (nestedQuestion) {
          if (nestedQuestion.type === 'ses' || nestedQuestion.type === 'les') {
            return Boolean(answer.essayAnswer && answer.essayAnswer.trim() !== '')
          }
          return Boolean(answer.answers && answer.answers.length > 0)
        }
      }
    }

    return false
  }, [answers, exam?.questions])

  const isAllQuestionsAnswered = useCallback(() => {
    if (!exam) return false

    const checkQuestionAnswered = (question: Question): boolean => {
      const answer = answers.find(a => a.questionId === question._id)

      if (question.type === 'nested' && question.questions) {
        return question.questions.every(subQuestion => checkQuestionAnswered(subQuestion))
      }

      if (question.type === 'ses' || question.type === 'les') {
        return Boolean(answer?.essayAnswer && answer.essayAnswer.trim() !== '')
      }

      return Boolean(answer?.answers && answer.answers.length > 0)
    }

    return exam.questions.every(checkQuestionAnswered)
  }, [exam, answers])

  const getQuestionNumber = useCallback((questions: Question[], currentIndex: number) => {
    let number = 1
    for (let i = 0; i < currentIndex; i++) {
      const question = questions[i]
      if (question.type === 'nested' && question.questions) {
        number += question.questions.length
      } else {
        number += 1
      }
    }
    return number
  }, [])

  if (loading || validatingAccess) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <Spinner size="lg" />
          <p className="text-foreground/70">
            {validatingAccess ? 'Validating access permissions...' : 'Loading examination...'}
          </p>
        </div>
      </div>
    )
  }

  if (!exam) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Card className="max-w-md w-full">
          <CardBody>
            <p className="text-center text-foreground/50">No examination found</p>
          </CardBody>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Modal
        isOpen={isTimeoutModalOpen}
        onClose={() => { }}
        hideCloseButton
        isDismissable={false}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">Time's Up!</ModalHeader>
          <ModalBody>
            <p>Your examination time has ended. Your answers will be submitted automatically.</p>
          </ModalBody>
          <ModalFooter>
            <Button color="secondary" onPress={handleTimeoutSubmit}>
              Submit Now
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <ExamResultsModal
        isOpen={isResultsModalOpen}
        onClose={handleResultsClose}
        examResult={examResult}
        questions={exam.questions}
        questionsPerPage={questionsPerPage}
        setCurrentPage={setCurrentPage}
      />

      <Card className="mb-8">
        <CardHeader className="flex gap-3">
          <div className="flex items-center gap-2">
            <div className="bg-secondary text-white p-2 rounded-full">
              <HealthiconsIExamMultipleChoice fontSize={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{exam.title}</h1>
              <p className="text-foreground/50">{exam.description}</p>
            </div>
          </div>
        </CardHeader>
        <Divider />
        <CardBody>
          <div className="flex justify-between items-center mb-4">
            <p className="text-foreground/50">Total Questions: {exam.questions.length}</p>
            <p className="text-foreground/50">Total Score: {exam.questions.reduce((acc, q) => acc + q.score, 0)}</p>
          </div>
        </CardBody>
      </Card>

      <div className="space-x-6 flex">
        <QuestionNavigation
          questions={exam.questions}
          currentPage={currentPage}
          questionsPerPage={questionsPerPage}
          timeRemaining={<ExamTimer initialTime={initialTime} onTimeout={handleTimeout} hasSubmitted={hasSubmitted} />}
          isQuestionAnswered={isQuestionAnswered}
          handleQuestionNavigation={handleQuestionNavigation}
        />
        <div className="space-y-6 w-2/3">
          {currentQuestions.map((question, index) => {
            const questionNumber = getQuestionNumber(exam.questions, startIndex + index)
            return (
              <QuestionCard
                key={question._id}
                question={question}
                questionNumber={questionNumber}
                answers={answers}
                setAnswers={setAnswers}
                examId={exam._id}
                code={schedule_id || undefined}
              />
            )
          })}
        </div>
      </div>
      <div className='flex w-full '>
        <div className='w-1/3'></div>
        <div className="mt-8 flex justify-start w-2/3 pl-4">
          <div className={`${currentPage == totalPages ? 'w-full flex justify-start items-center' : null}`}>
            <Button
              color="default"
              onPress={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              isDisabled={currentPage === 1}
            >
              Previous
            </Button>
            <span className="mx-4">Page {currentPage} of {totalPages}</span>
            <Button
              color="default"
              onPress={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              isDisabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
          {currentPage == totalPages && (
            <div className="flex items-center gap-4">
              <Button
                color="secondary"
                size="md"
                isLoading={isSubmitting}
                onPress={handleSubmit}
                isDisabled={!isAllQuestionsAnswered()}
              >
                Submit
              </Button>
              {!isAllQuestionsAnswered() && (
                <span className="text-sm text-danger">Please answer all questions before submitting</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ExaminationPage
