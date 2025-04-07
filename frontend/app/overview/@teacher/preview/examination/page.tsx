"use client"

import React, { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { clientAPI } from '@/config/axios.config'
import { errorHandler } from '@/utils/error'
import { Card, CardBody, CardHeader, Divider, Spinner, Checkbox, Button, Textarea, CardFooter, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, RadioGroup, Radio } from '@nextui-org/react'
import { HealthiconsIExamMultipleChoice } from '@/components/icons/icons'
import QuestionNavigation from '@/components/exam/QuestionNavigation'
import QuestionCard from '@/components/exam/QuestionCard'
import ExamResultsModal from '@/components/exam/ExamResultsModal'

interface Question {
  _id: string
  question: string
  type: 'mc' | 'tf' | 'ses' | 'les' | 'nested'
  choices?: {
    content: string
    isCorrect: boolean
  }[]
  isTrue?: boolean
  expectedAnswer?: string
  maxWords?: number
  score: number
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
  const [timeRemaining, setTimeRemaining] = useState(60 * 60) // (60 * 60) 1 hour in seconds
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [isTimeoutModalOpen, setIsTimeoutModalOpen] = useState(false)
  const [isResultsModalOpen, setIsResultsModalOpen] = useState(false)
  const [examResult, setExamResult] = useState<ExamResult | null>(null)
  const questionsPerPage = 5

  // Load saved answers from localStorage on component mount
  useEffect(() => {
    if (_id) {
      const savedAnswers = localStorage.getItem(`exam_answers_${_id}`)
      if (savedAnswers) {
        setAnswers(JSON.parse(savedAnswers))
      }
    }
  }, [_id])

  // Save answers to localStorage whenever they change
  useEffect(() => {
    if (_id && answers.length > 0) {
      localStorage.setItem(`exam_answers_${_id}`, JSON.stringify(answers))
    }
  }, [answers, _id])

  // Clear localStorage after successful submission
  const clearSavedAnswers = () => {
    if (_id) {
      localStorage.removeItem(`exam_answers_${_id}`)
    }
  }

  const totalPages = Math.ceil((exam?.questions.length || 0) / questionsPerPage)
  const startIndex = (currentPage - 1) * questionsPerPage
  const endIndex = startIndex + questionsPerPage
  const currentQuestions = exam?.questions.slice(startIndex, endIndex) || []
  const router = useRouter()

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null

    if (!hasSubmitted) {
      timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 0) {
            if (timer) clearInterval(timer)
            if (!hasSubmitted) {
              setHasSubmitted(true)
              setIsTimeoutModalOpen(true)
            }
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }

    return () => {
      if (timer) clearInterval(timer)
    }
  }, [hasSubmitted])

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const remainingSeconds = seconds % 60
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  function cleanBase64Pem(pem: string): string {
    return pem
      .replace(/-----BEGIN .*?-----/g, "") // Remove PEM header
      .replace(/-----END .*?-----/g, "")   // Remove PEM footer
      .replace(/\s+/g, "");               // Remove all whitespace & newlines
  }

  async function decryptRSA(encryptedData: string, privateKeyPEM: string): Promise<string> {
    try {
      // Clean the PEM key and decode Base64
      const base64Key = cleanBase64Pem(privateKeyPEM);
      const binaryKey = Uint8Array.from(atob(base64Key), c => c.charCodeAt(0));

      // Import the private key
      const privateKey = await window.crypto.subtle.importKey(
        "pkcs8",
        binaryKey.buffer,
        { name: "RSA-OAEP", hash: "SHA-256" },
        true,
        ["decrypt"]
      );

      // Decrypt the message
      const decryptedBuffer = await window.crypto.subtle.decrypt(
        { name: "RSA-OAEP" },
        privateKey,
        Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0))
      );

      return new TextDecoder().decode(decryptedBuffer);
    } catch (error) {
      console.error("Decryption Error:", error);
      throw new Error("Failed to decrypt data.");
    }
  }

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

        setExam(examData)
        setAnswers(initialAnswers)
      } catch (error) {
        errorHandler(error)
      } finally {
        setLoading(false)
      }
    }

    if (_id) {
      fetchExam()
    }
  }, [_id])

  const handleCheckboxChange = (questionId: string, choice: string, isSingleAnswer: boolean) => {
    setAnswers(prev => prev.map(answer => {
      if (answer.questionId === questionId) {
        if (isSingleAnswer) {
          // For single answer, replace the entire array with the new choice
          return { ...answer, answers: answer.answers.includes(choice) ? [] : [choice] }
        } else {
          // For multiple answers, toggle the choice
          const newAnswers = answer.answers.includes(choice)
            ? answer.answers.filter(a => a !== choice)
            : [...answer.answers, choice]
          return { ...answer, answers: newAnswers }
        }
      }
      return answer
    }))
  }

  const handleTrueFalseChange = (questionId: string, value: boolean) => {
    setAnswers(prev => prev.map(answer => {
      if (answer.questionId === questionId) {
        return { ...answer, answers: [value.toString()] }
      }
      return answer
    }))
  }

  const handleEssayChange = (questionId: string, value: string) => {
    setAnswers(prev => prev.map(answer => {
      if (answer.questionId === questionId) {
        return { ...answer, essayAnswer: value }
      }
      return answer
    }))
  }

  const checkAnswers = (): ExamResult => {
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

      if (question.type === 'mc') {
        // For multiple choice, check if all correct choices are selected and no incorrect ones
        const correctChoices = question.choices?.filter(c => c.isCorrect).map(c => c.content) || []
        isCorrect = userAnswer?.answers.length === correctChoices.length &&
          correctChoices.every(ans => userAnswer.answers.includes(ans)) &&
          userAnswer.answers.every(ans => correctChoices.includes(ans))
      } else if (question.type === 'tf') {
        // For true/false, check if the answer matches isTrue
        isCorrect = userAnswer?.answers[0] === question.isTrue?.toString()
      } else if (question.type === 'ses' || question.type === 'les') {
        // For essay questions, always mark as correct in preview mode
        isCorrect = true
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
        }
      }

      if (isCorrect) {
        obtainedScore += question.score
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
        score: question.score
      }
    })

    return {
      totalScore,
      obtainedScore,
      correctAnswers,
      totalQuestions: exam.questions.length,
      details
    }
  }

  const handleSubmit = async () => {
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
  }

  // Updated function to handle navigation to specific question
  const handleQuestionNavigation = (questionIndex: number, questionId: string) => {
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
  }

  const handleTimeout = () => {
    setHasSubmitted(true)
    setIsTimeoutModalOpen(true)
  }

  const handleTimeoutSubmit = () => {
    setIsTimeoutModalOpen(false)
    handleSubmit()
  }

  const handleResultsClose = () => {
    setIsResultsModalOpen(false)
    clearSavedAnswers()
    router.push(`/overview`)
  }

  const isQuestionAnswered = (questionId: string) => {
    const answer = answers.find(a => a.questionId === questionId);
    if (!answer) return false;

    // First check if it's a main question
    const mainQuestion = exam?.questions.find(q => q._id === questionId);
    if (mainQuestion) {
      if (mainQuestion.type === 'ses' || mainQuestion.type === 'les') {
        return answer.essayAnswer && answer.essayAnswer.trim() !== '';
      }
      return answer.answers && answer.answers.length > 0;
    }

    // If not found in main questions, check nested questions
    for (const question of exam?.questions || []) {
      if (question.type === 'nested' && question.questions) {
        const nestedQuestion = question.questions.find(q => q._id === questionId);
        if (nestedQuestion) {
          if (nestedQuestion.type === 'ses' || nestedQuestion.type === 'les') {
            return answer.essayAnswer && answer.essayAnswer.trim() !== '';
          }
          return answer.answers && answer.answers.length > 0;
        }
      }
    }

    return false;
  };

  const isAllQuestionsAnswered = () => {
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
  }

  // Add a new function to calculate question numbers
  const getQuestionNumber = (questions: Question[], currentIndex: number) => {
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
  };

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
          timeRemaining={timeRemaining}
          isQuestionAnswered={(questionId: string): boolean => {
            const result = isQuestionAnswered(questionId);
            return result === undefined ? false : !!result;
          }}
          handleQuestionNavigation={handleQuestionNavigation}
          formatTime={formatTime}
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
                handleCheckboxChange={handleCheckboxChange}
                handleTrueFalseChange={handleTrueFalseChange}
                handleEssayChange={handleEssayChange}
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

export default PreviewExaminationPage