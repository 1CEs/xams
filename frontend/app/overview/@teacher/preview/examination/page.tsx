"use client"

import React, { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { clientAPI } from '@/config/axios.config'
import { errorHandler } from '@/utils/error'
import { Card, CardBody, CardHeader, Divider, Spinner, Checkbox, Button, Textarea, CardFooter, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@nextui-org/react'
import { HealthiconsIExamMultipleChoice } from '@/components/icons/icons'
import { extractHtml } from '@/utils/extract-html'
import Anya from '@/public/images/anya.png'
import { Image } from '@nextui-org/react'

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
        setExam(res.data.data)
        // Initialize answers array
        setAnswers(res.data.data.questions.map((q: Question) => ({
          questionId: q._id,
          answers: [],
          essayAnswer: ''
        })))
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
  const handleQuestionNavigation = (questionIndex: number) => {
    // Calculate the page that contains this question
    const targetPage = Math.ceil((questionIndex + 1) / questionsPerPage)

    // Update current page if needed
    if (currentPage !== targetPage) {
      setCurrentPage(targetPage)
    }

    // Use setTimeout to ensure the DOM has updated with the new questions before scrolling
    setTimeout(() => {
      // Calculate the relative index within the current page
      const relativeIndex = questionIndex % questionsPerPage

      // Find and scroll to the question
      const questionElement = document.getElementById(`question-${relativeIndex}`)
      if (questionElement) {
        questionElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }, 100)
  }

  const handleTimeoutSubmit = () => {
    setIsTimeoutModalOpen(false)
    handleSubmit()
  }

  const handleResultsClose = () => {
    setIsResultsModalOpen(false)
    router.push(`/overview`)
  }

  const isQuestionAnswered = (questionId: string) => {
    const answer = answers.find(a => a.questionId === questionId);
    if (!answer) return false;

    const question = exam?.questions.find(q => q._id === questionId);
    if (!question) return false;

    if (question.type === 'ses' || question.type === 'les') {
      return answer.essayAnswer && answer.essayAnswer.trim() !== '';
    }

    return answer.answers && answer.answers.length > 0;
  };

  const isAllQuestionsAnswered = () => {
    if (!exam) return false
    return exam.questions.every(question => {
      const answer = answers.find(a => a.questionId === question._id)
      if (question.type === 'ses' || question.type === 'les') {
        return answer?.essayAnswer && answer.essayAnswer.trim() !== ''
      }
      return answer?.answers && answer.answers.length > 0
    })
  }

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

      <Modal
        isOpen={isResultsModalOpen}
        onClose={handleResultsClose}
        size="5xl"
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <h2 className="text-2xl font-bold">Exam Results</h2>
            <p className="text-sm text-foreground/50">Your examination has been submitted successfully</p>
          </ModalHeader>
          <ModalBody>
            {examResult && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <Card className="p-4">
                    <p className="text-foreground/50">Total Score</p>
                    <p className="text-2xl font-bold">{examResult.obtainedScore}/{examResult.totalScore}</p>
                  </Card>
                  <Card className="p-4">
                    <p className="text-foreground/50">Correct Answers</p>
                    <p className="text-2xl font-bold">{examResult.correctAnswers}/{examResult.totalQuestions}</p>
                  </Card>
                </div>

                <Divider />

                <div className="space-y-4">
                  <h3 className="font-semibold">Question Details</h3>
                  <div className="grid grid-cols-5 gap-2">
                    {examResult.details.map((detail, index) => (
                      <Card
                        key={detail.questionId}
                        className={`p-2 ${detail.isCorrect ? 'border-success' : 'border-danger'} h-24 flex flex-col justify-center items-center cursor-pointer hover:scale-105 transition-transform`}
                        onClick={() => {
                          const questionIndex = exam?.questions.findIndex(q => q._id === detail.questionId) || 0
                          const page = Math.floor(questionIndex / questionsPerPage) + 1
                          setCurrentPage(page)
                          setIsResultsModalOpen(false)
                          setTimeout(() => {
                            const questionElement = document.getElementById(`question-${questionIndex % questionsPerPage}`)
                            if (questionElement) {
                              questionElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
                            }
                          }, 100)
                        }}
                      >
                        <div className="text-center">
                          <p className="font-medium text-sm">Q{index + 1}</p>
                          <p className={`text-md ${detail.isCorrect ? 'text-success' : 'text-danger'}`}>
                            {detail.isCorrect ? '✓' : '✗'}
                          </p>
                          <p className="text-xs text-foreground/50">{detail.isCorrect ? detail.score : 0}/{detail.score}</p>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button color="secondary" onPress={handleResultsClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

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
        <Card className='w-1/3 h-fit sticky top-20'>
          <CardBody className='px-5'>
            <div className="flex flex-col gap-4">
              <div className='flex justify-between items-center'>
                <h2 className="text-lg font-semibold">Questions Navigation</h2>
                <span className={`${timeRemaining <= 300 ? 'text-danger' : ''}`}>
                  {formatTime(timeRemaining)}
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {exam?.questions.map((question, index) => {
                  const isAnswered = isQuestionAnswered(question._id);
                  const isCurrentPage = Math.floor(index / questionsPerPage) + 1 === currentPage;

                  return (
                    <Button
                      key={index}
                      size="sm"
                      color={isCurrentPage ? "secondary" : "default"}
                      onPress={() => handleQuestionNavigation(index)}
                      className={`
                        ${!isCurrentPage && isAnswered ? 'border-success border' : ''}
                        ${!isCurrentPage && !isAnswered ? 'border-gray-500 border' : ''}
                      `}
                    >
                      {index + 1}
                    </Button>
                  );
                })}
              </div>
              <p className="text-sm text-foreground/50">
                Page {currentPage} of {totalPages} | Showing questions {startIndex + 1}-{Math.min(endIndex, exam.questions.length)} of {exam.questions.length}
              </p>
            </div>
          </CardBody>
        </Card>
        <div className="space-y-6 w-2/3">
          {currentQuestions.map((question, index) => (
            <Card key={question._id} id={`question-${index}`} className="">
              <CardBody>
                <div className="flex items-start gap-4 px-1">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary text-white text-sm flex items-center justify-center">
                    {startIndex + index + 1}
                  </div>
                  <div className="flex-grow">
                    <div className="mb-4 flex justify-between">
                      <div>
                        <p className="text-lg font-medium">{extractHtml(question.question)}</p>
                        <p className='text-sm text-foreground/50'>
                          {question.type === 'mc' ? 'Multiple Choice' :
                            question.type === 'tf' ? 'True/False' :
                              question.type === 'ses' ? 'Short Essay' :
                                question.type === 'nested' ? 'Nested Question' : 'Long Essay'}
                        </p>
                      </div>
                      <p className="text-sm text-foreground/50">Score: {question.score}</p>
                    </div>

                    {question.type === 'mc' && (
                      <div className="flex flex-col space-y-2">
                        {question.choices?.map((choice, choiceIndex) => (
                          <div key={choiceIndex} className="flex items-center gap-3">
                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-secondary text-white flex items-center justify-center text-sm">
                              {String.fromCharCode(65 + choiceIndex)}
                            </div>
                            <Checkbox
                              isSelected={answers.find(a => a.questionId === question._id)?.answers.includes(choice.content) || false}
                              onValueChange={() => handleCheckboxChange(question._id, choice.content, question.choices?.filter(c => c.isCorrect).length === 1)}
                              className="flex-grow p-3"
                            >
                              {extractHtml(choice.content)}
                            </Checkbox>
                          </div>
                        ))}
                      </div>
                    )}

                    {question.type === 'tf' && (
                      <div className="flex flex-col space-y-2">
                        {['True', 'False'].map((option, index) => (
                          <div key={option} className="flex items-center gap-3">
                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-secondary text-white flex items-center justify-center text-sm">
                              {String.fromCharCode(65 + index)}
                            </div>
                            <Checkbox
                              isSelected={answers.find(a => a.questionId === question._id)?.answers.includes(option.toLowerCase()) || false}
                              onValueChange={() => handleTrueFalseChange(question._id, option === 'True')}
                              className="flex-grow p-3 rounded-lg border border-default-200"
                            >
                              {option}
                            </Checkbox>
                          </div>
                        ))}
                      </div>
                    )}

                    {(question.type === 'ses' || question.type === 'les') && (
                      <Textarea
                        label="Your Answer"
                        placeholder="Type your answer here..."
                        value={answers.find(a => a.questionId === question._id)?.essayAnswer || ''}
                        onValueChange={(value) => handleEssayChange(question._id, value)}
                        minRows={question.type === 'les' ? 5 : 2}
                        maxRows={question.type === 'les' ? 10 : 4}
                      />
                    )}

                    {question.type === 'nested' && question.questions && (
                      <div className="space-y-4 mt-4">
                        {question.questions.map((subQuestion, subIndex) => (
                          <div key={subIndex} className="border-l-2 border-secondary pl-4">
                            <p className="text-md font-medium mb-2">{extractHtml(subQuestion.question)}</p>
                            <p className="text-sm text-foreground/50 mb-2">
                              {subQuestion.type === 'mc' ? 'Multiple Choice' :
                                subQuestion.type === 'tf' ? 'True/False' :
                                  subQuestion.type === 'ses' ? 'Short Essay' : 'Long Essay'}
                            </p>

                            {subQuestion.type === 'mc' && (
                              <div className="flex flex-col space-y-2">
                                {subQuestion.choices?.map((choice, choiceIndex) => (
                                  <div key={choiceIndex} className="flex items-center gap-3">
                                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-secondary text-white flex items-center justify-center text-sm">
                                      {String.fromCharCode(65 + choiceIndex)}
                                    </div>
                                    <Checkbox
                                      isSelected={answers.find(a => a.questionId === question._id)?.answers[subIndex]?.split(',').includes(choice.content) || false}
                                      onValueChange={() => {
                                        const currentAnswers = answers.find(a => a.questionId === question._id)?.answers || []
                                        const subAnswers = currentAnswers[subIndex]?.split(',') || []
                                        const newSubAnswers = subAnswers.includes(choice.content)
                                          ? subAnswers.filter(a => a !== choice.content)
                                          : [...subAnswers, choice.content]
                                        const newAnswers = [...currentAnswers]
                                        newAnswers[subIndex] = newSubAnswers.join(',')
                                        setAnswers(prev => prev.map(a => 
                                          a.questionId === question._id 
                                            ? { ...a, answers: newAnswers }
                                            : a
                                        ))
                                      }}
                                      className="flex-grow p-3"
                                    >
                                      {extractHtml(choice.content)}
                                    </Checkbox>
                                  </div>
                                ))}
                              </div>
                            )}

                            {subQuestion.type === 'tf' && (
                              <div className="flex flex-col space-y-2">
                                {['True', 'False'].map((option, index) => (
                                  <div key={option} className="flex items-center gap-3">
                                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-secondary text-white flex items-center justify-center text-sm">
                                      {String.fromCharCode(65 + index)}
                                    </div>
                                    <Checkbox
                                      isSelected={answers.find(a => a.questionId === question._id)?.answers[subIndex] === option.toLowerCase()}
                                      onValueChange={() => {
                                        const currentAnswers = answers.find(a => a.questionId === question._id)?.answers || []
                                        const newAnswers = [...currentAnswers]
                                        newAnswers[subIndex] = option.toLowerCase()
                                        setAnswers(prev => prev.map(a => 
                                          a.questionId === question._id 
                                            ? { ...a, answers: newAnswers }
                                            : a
                                        ))
                                      }}
                                      className="flex-grow p-3 rounded-lg border border-default-200"
                                    >
                                      {option}
                                    </Checkbox>
                                  </div>
                                ))}
                              </div>
                            )}

                            {(subQuestion.type === 'ses' || subQuestion.type === 'les') && (
                              <Textarea
                                label="Your Answer"
                                placeholder="Type your answer here..."
                                value={answers.find(a => a.questionId === question._id)?.essayAnswer || ''}
                                onValueChange={(value) => {
                                  const currentAnswers = answers.find(a => a.questionId === question._id)?.answers || []
                                  const newAnswers = [...currentAnswers]
                                  newAnswers[subIndex] = value
                                  setAnswers(prev => prev.map(a => 
                                    a.questionId === question._id 
                                      ? { ...a, answers: newAnswers }
                                      : a
                                  ))
                                }}
                                minRows={subQuestion.type === 'les' ? 5 : 2}
                                maxRows={subQuestion.type === 'les' ? 10 : 4}
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
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