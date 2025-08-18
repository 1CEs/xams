"use client"

import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { clientAPI } from '@/config/axios.config'
import { errorHandler } from '@/utils/error'
import { Card, CardBody, CardHeader, Divider, Spinner, Checkbox, Button, Textarea, CardFooter, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, RadioGroup, Radio } from '@nextui-org/react'
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
  isTrue?: boolean
  expectedAnswer?: string
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

const PreviewExaminationPage = () => {
  const params = useSearchParams()
  const _id = params.get('id')
  const [exam, setExam] = useState<ExamResponse | null>(null)
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
  const initialTime = 60 * 60 // Default to 1 hour for preview mode

  // Load saved answers and current page from localStorage on component mount
  useEffect(() => {
    if (_id) {
      // Load saved answers
      const savedAnswers = localStorage.getItem(`exam_answers_${_id}`)
      if (savedAnswers) {
        setAnswers(JSON.parse(savedAnswers))
      }
      
      // Load saved current page
      const savedPage = localStorage.getItem(`preview_exam_page_${_id}`)
      if (savedPage) {
        setCurrentPage(parseInt(savedPage, 10))
      }
    }
  }, [_id])

  // Save answers to localStorage whenever they change
  useEffect(() => {
    if (_id && answers.length > 0) {
      localStorage.setItem(`exam_answers_${_id}`, JSON.stringify(answers))
    }
  }, [answers, _id])
  
  // Save current page to localStorage whenever it changes
  useEffect(() => {
    if (_id) {
      localStorage.setItem(`preview_exam_page_${_id}`, currentPage.toString())
    }
  }, [currentPage, _id])

  // Clear localStorage after successful submission
  const clearSavedAnswers = useCallback(() => {
    if (_id) {
      localStorage.removeItem(`exam_answers_${_id}`)
      localStorage.removeItem(`preview_exam_page_${_id}`) // Also clear saved page
      // Also clear randomized choices from localStorage
      if (exam) {
        exam.questions.forEach(question => {
          if (question.isRandomChoices) {
            localStorage.removeItem(`exam_${_id}_randomized_choices_${question._id}`)
          }
          // Also clear for nested questions
          if (question.type === 'nested' && question.questions) {
            question.questions.forEach(subQuestion => {
              if (subQuestion.isRandomChoices) {
                localStorage.removeItem(`exam_${_id}_randomized_choices_${subQuestion._id}`)
              }
            })
          }
        })
      }
    }
  }, [_id, exam])

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
  
  const router = useRouter()

  useEffect(() => {
    const fetchExam = async () => {
      try {
        const res = await clientAPI.get(`exam/${_id}`)
        const examData = res.data.data

        // Load saved answers from localStorage
        const savedAnswers = localStorage.getItem(`exam_answers_${_id}`)

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

        initializeAnswers(examData.questions)

        // If there are saved answers, merge them with the initial answers
        if (savedAnswers) {
          const parsedSavedAnswers = JSON.parse(savedAnswers)
          initialAnswers = initialAnswers.map((answer: Answer) => {
            const savedAnswer = parsedSavedAnswers.find((sa: Answer) => sa.questionId === answer.questionId)
            return savedAnswer || answer
          })
        }

        // Check for randomized choices in localStorage and apply them to the exam data
        const applyRandomizedChoices = (questions: Question[]) => {
          questions.forEach(q => {
            if (q.isRandomChoices && q.choices && _id) {
              const storedRandomizedChoices = localStorage.getItem(`exam_${_id}_randomized_choices_${q._id}`)
              if (storedRandomizedChoices) {
                // We don't modify the original exam data, the QuestionCard component will handle this
                // This is just to ensure the data is loaded
              }
            }
            
            // Also check nested questions
            if (q.type === 'nested' && q.questions) {
              applyRandomizedChoices(q.questions)
            }
          })
        }
        
        applyRandomizedChoices(examData.questions)

        setExam(examData)
        setAnswers(initialAnswers)
        setExamLoaded(true)
      } catch (error) {
        errorHandler(error)
      } finally {
        setLoading(false)
      }
    }

    if (_id && !examLoaded) {
      fetchExam()
    }
  }, [_id, examLoaded])

  // Memoize the checkAnswers function
  const checkAnswers = useCallback((): ExamResult => {
    if (!exam) return {
      totalScore: 0,
      obtainedScore: 0,
      correctAnswers: 0,
      totalQuestions: 0,
      details: []
    }

    let totalScore = 0
    let obtainedScore = 0
    let correctAnswers = 0
    const details = exam.questions.map(question => {
      const userAnswer = answers.find(a => a.questionId === question._id)
      let isCorrect = false
      let questionScore = 0

      if (question.type === 'mc') {
        // For multiple choice, check if all correct choices are selected and no incorrect ones
        const correctChoices = question.choices?.filter(c => c.isCorrect).map(c => c.content) || []
        isCorrect = userAnswer?.answers.length === correctChoices.length &&
          correctChoices.every(ans => userAnswer.answers.includes(ans)) &&
          userAnswer.answers.every(ans => correctChoices.includes(ans))

        // Calculate score based on individual choice scores
        if (isCorrect) {
          questionScore = question.choices
            ?.filter(c => c.isCorrect)
            .reduce((acc, choice) => acc + (choice.score || 0), 0) || 0
        }
      } else if (question.type === 'tf') {
        // For true/false, check if the answer matches isTrue
        isCorrect = userAnswer?.answers[0] === question.isTrue?.toString()
        questionScore = isCorrect ? question.score : 0
      } else if (question.type === 'ses' || question.type === 'les') {
        // For essay questions, always mark as correct in preview mode
        isCorrect = true
        questionScore = question.score
      } else if (question.type === 'nested') {
        // For nested questions, check all sub-questions
        if (question.questions && userAnswer?.answers) {
          const subQuestionAnswers = userAnswer.answers.map((ans, index) => {
            const subQuestion = question.questions![index]
            if (subQuestion.type === 'mc') {
              const correctChoices = subQuestion.choices?.filter(c => c.isCorrect).map(c => c.content) || []
              const userSubAnswers = ans.split(',')
              return userSubAnswers.length === correctChoices.length &&
                correctChoices.every(c => userSubAnswers.includes(c)) &&
                userSubAnswers.every(u => correctChoices.includes(u))
            } else if (subQuestion.type === 'tf') {
              return ans === subQuestion.isTrue?.toString()
            } else {
              return true // For essay questions in nested questions
            }
          })
          isCorrect = subQuestionAnswers.every(Boolean)
          questionScore = isCorrect ? question.score : 0
        }
      }

      if (isCorrect) {
        obtainedScore += questionScore
        correctAnswers++
      }
      totalScore += question.score

      return {
        questionId: question._id,
        isCorrect,
        userAnswer: userAnswer?.answers || [],
        correctAnswer: question.type === 'mc'
          ? question.choices?.filter(c => c.isCorrect).map(c => c.content) || []
          : question.type === 'tf'
            ? [question.isTrue?.toString() || '']
            : question.type === 'nested' && question.questions
              ? question.questions.map(q =>
                q.type === 'mc'
                  ? q.choices?.filter(c => c.isCorrect).map(c => c.content).join(',') || ''
                  : q.type === 'tf'
                    ? q.isTrue?.toString() || ''
                    : ''
              )
              : [],
        score: questionScore
      }
    })

    return {
      totalScore,
      obtainedScore,
      correctAnswers,
      totalQuestions: exam.questions.length,
      details
    }
  }, [exam, answers])

  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true)
    try {
      const result = checkAnswers()
      setExamResult(result)
      setIsResultsModalOpen(true)
      clearSavedAnswers() // Clear saved answers after submission
      // const res = await clientAPI.post(`exam/${_id}/submit`, { 
      //   answers,
      //   result
      // })
    } catch (error) {
      errorHandler(error)
    } finally {
      setIsSubmitting(false)
    }
  }, [checkAnswers, clearSavedAnswers])

  // Memoize the handleQuestionNavigation function
  const handleQuestionNavigation = useCallback((questionIndex: number, questionId: string) => {
    // Calculate the page that contains this question
    const targetPage = Math.ceil((questionIndex + 1) / questionsPerPage)

    // Update current page if needed
    if (currentPage !== targetPage) {
      setCurrentPage(targetPage)
    }

    // Use setTimeout to ensure the DOM has updated with the new questions before scrolling
    setTimeout(() => {
      // Find and scroll to the question
      const questionElement = document.getElementById(`question-${questionId}`)
      if (questionElement) {
        const headerOffset = 100 // Adjust this value based on your header height
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

  // Memoize the isQuestionAnswered function
  const isQuestionAnswered = useCallback((questionId: string): boolean => {
    const answer = answers.find(a => a.questionId === questionId);
    if (!answer) return false;

    // First check if it's a main question
    const mainQuestion = exam?.questions.find(q => q._id === questionId);
    if (mainQuestion) {
      if (mainQuestion.type === 'ses' || mainQuestion.type === 'les') {
        return Boolean(answer.essayAnswer && answer.essayAnswer.trim() !== '');
      }
      return Boolean(answer.answers && answer.answers.length > 0);
    }

    // If not found in main questions, check nested questions
    for (const question of exam?.questions || []) {
      if (question.type === 'nested' && question.questions) {
        const nestedQuestion = question.questions.find(q => q._id === questionId);
        if (nestedQuestion) {
          if (nestedQuestion.type === 'ses' || nestedQuestion.type === 'les') {
            return Boolean(answer.essayAnswer && answer.essayAnswer.trim() !== '');
          }
          return Boolean(answer.answers && answer.answers.length > 0);
        }
      }
    }

    return false;
  }, [answers, exam?.questions]);

  // Memoize the isAllQuestionsAnswered function
  const isAllQuestionsAnswered = useCallback(() => {
    if (!exam) return false

    const checkQuestionAnswered = (question: Question): boolean => {
      const answer = answers.find(a => a.questionId === question._id)

      if (question.type === 'nested' && question.questions) {
        // For nested questions, check all sub-questions
        return question.questions.every(subQuestion => checkQuestionAnswered(subQuestion))
      }

      if (question.type === 'ses' || question.type === 'les') {
        return Boolean(answer?.essayAnswer && answer.essayAnswer.trim() !== '')
      }

      return Boolean(answer?.answers && answer.answers.length > 0)
    }

    return exam.questions.every(checkQuestionAnswered)
  }, [exam, answers]);

  // Memoize the getQuestionNumber function
  const getQuestionNumber = useCallback((questions: Question[], currentIndex: number) => {
    let number = 1;
    for (let i = 0; i < currentIndex; i++) {
      const question = questions[i];
      if (question.type === 'nested' && question.questions) {
        number += question.questions.length;
      } else {
        number += 1;
      }
    }
    return number;
  }, []);

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
    <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
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

      <Card className="mb-4 sm:mb-8">
        <CardHeader className="flex gap-3 p-3 sm:p-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="bg-secondary text-white p-2 rounded-full flex-shrink-0">
              <HealthiconsIExamMultipleChoice fontSize={20} className="sm:text-2xl" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-2xl font-bold truncate">{exam.title}</h1>
              <p className="text-sm sm:text-base text-foreground/50 line-clamp-2">{exam.description}</p>
            </div>
          </div>
        </CardHeader>
        <Divider />
        <CardBody className="p-3 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-4 mb-4">
            <p className="text-sm sm:text-base text-foreground/50">Total Questions: {exam.questions.length}</p>
            <p className="text-sm sm:text-base text-foreground/50">Total Score: {exam.questions.reduce((acc, q) => acc + q.score, 0)}</p>
          </div>
        </CardBody>
      </Card>

      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
        <div className="lg:w-1/3">
          <QuestionNavigation
            questions={exam.questions}
            currentPage={currentPage}
            questionsPerPage={questionsPerPage}
            timeRemaining={<ExamTimer initialTime={initialTime} onTimeout={handleTimeout} hasSubmitted={hasSubmitted} />}
            isQuestionAnswered={isQuestionAnswered}
            handleQuestionNavigation={handleQuestionNavigation}
          />
        </div>
        <div className="space-y-4 sm:space-y-6 lg:w-2/3">
          {currentQuestions.map((question, index) => {
            const questionNumber = getQuestionNumber(exam.questions, startIndex + index)
            return (
              <QuestionCard
                key={question._id}
                question={question}
                questionNumber={questionNumber}
                answers={answers}
                setAnswers={setAnswers}
                examId={_id || undefined}
              />
            )
          })}
        </div>
      </div>
      <div className='flex flex-col lg:flex-row w-full gap-4'>
        <div className='lg:w-1/3'></div>
        <div className="mt-4 sm:mt-8 flex flex-col sm:flex-row justify-start lg:w-2/3 gap-4">
          <div className={`${currentPage == totalPages ? 'w-full flex flex-col sm:flex-row justify-start items-center gap-3' : 'flex flex-col sm:flex-row items-center gap-3'}`}>
            <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
              <Button
                color="default"
                size="sm"
                onPress={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                isDisabled={currentPage === 1}
                className="flex-1 sm:flex-none"
              >
                Previous
              </Button>
              <span className="text-sm sm:text-base whitespace-nowrap">Page {currentPage} of {totalPages}</span>
              <Button
                color="default"
                size="sm"
                onPress={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                isDisabled={currentPage === totalPages}
                className="flex-1 sm:flex-none"
              >
                Next
              </Button>
            </div>
            {currentPage == totalPages && (
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                <Button
                  color="secondary"
                  size="md"
                  isLoading={isSubmitting}
                  onPress={handleSubmit}
                  isDisabled={!isAllQuestionsAnswered()}
                  className="w-full sm:w-auto"
                >
                  Submit
                </Button>
                {!isAllQuestionsAnswered() && (
                  <span className="text-xs sm:text-sm text-danger text-center">Please answer all questions before submitting</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default PreviewExaminationPage
