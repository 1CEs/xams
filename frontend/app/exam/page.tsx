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
  const course_id = params.get('course_id')
  const group_id = params.get('group_id')
  const setting_id = params.get('setting_id')
  const code = params.get('code')
  
  const [exam, setExam] = useState<ExamResponse | null>(null)
  const [setting, setSetting] = useState<ISetting | null>(null)
  const [loading, setLoading] = useState(true)
  const [answers, setAnswers] = useState<Answer[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [isTimeoutModalOpen, setIsTimeoutModalOpen] = useState(false)
  const [isResultsModalOpen, setIsResultsModalOpen] = useState(false)
  const [examResult, setExamResult] = useState<ExamResult | null>(null)
  const [examLoaded, setExamLoaded] = useState(false)
  const questionsPerPage = 5
  const router = useRouter()

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
          }
          // Also clear for nested questions
          if (question.type === 'nested' && question.questions) {
            question.questions.forEach(subQuestion => {
              if (subQuestion.isRandomChoices) {
                localStorage.removeItem(`exam_${exam._id}_randomized_choices_${subQuestion._id}`)
              }
            })
          }
        })
      }
    }
  }, [exam])

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
        let examData: ExamResponse | null = null
        const setting = await clientAPI.get(`/course/setting?course_id=${course_id}&group_id=${group_id}&setting_id=${setting_id}`)
        if (setting.data.code === 200) {
          setSetting(setting.data.data)
          const exam = await clientAPI.get(`/exam/${setting.data.data.exam_id}`)
          if (exam.data.code === 200) {
            examData = exam.data.data
          }
        }

        // Load saved answers from localStorage
        const savedAnswers = localStorage.getItem(`exam_answers_${code}`)

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

        initializeAnswers(exam?.questions || [])

        // If there are saved answers, merge them with the initial answers
        if (savedAnswers) {
          const parsedSavedAnswers = JSON.parse(savedAnswers)
          initialAnswers = initialAnswers.map((answer: Answer) => {
            const savedAnswer = parsedSavedAnswers.find((sa: Answer) => sa.questionId === answer.questionId)
            return savedAnswer || answer
          })
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

    if (code && !examLoaded) {
      fetchExam()
    }
  }, [code, examLoaded])

  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true)
    try {
      const res = await clientAPI.post(`exam/student/${code}/submit`, { 
        answers,
        course_id,
        group_id,
        setting_id
      })
      setExamResult(res.data.data)
      setIsResultsModalOpen(true)
      clearSavedAnswers()
    } catch (error) {
      errorHandler(error)
    } finally {
      setIsSubmitting(false)
    }
  }, [answers, code, course_id, group_id, setting_id, clearSavedAnswers])

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

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner size="lg" />
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
                examId={code || undefined}
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