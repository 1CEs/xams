"use client"

import { useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { useFetch } from "@/hooks/use-fetch"
import Loading from "@/components/state/loading"
import NotFound from "@/components/state/not-found"
import { Button, Card, CardBody, CardHeader, Progress, Radio, RadioGroup } from "@nextui-org/react"
import { useRouter } from "next/navigation"
import { toast } from "react-toastify"
import { clientAPI } from "@/config/axios.config"
import { errorHandler } from "@/utils/error"

export default function TakeExamPage({ params }: { params: { id: string } }) {
  const searchParams = useSearchParams()
  const examCode = searchParams.get("code")
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const { data, error, isLoading } = useFetch<ServerResponse<ExamResponse>>(`/exam/${params.id}`)
  
  useEffect(() => {
    // Check if the exam code is valid
    if (examCode && data?.data) {
      if (examCode === data.data.exam_code) {
        setIsAuthorized(true)
        // Set initial time remaining
        setTimeRemaining(data.data.time_limit * 60)
      } else {
        toast.error("Invalid exam code")
        router.push("/overview")
      }
    }
  }, [examCode, data, router])
  
  // Timer effect
  useEffect(() => {
    if (!isAuthorized || timeRemaining <= 0) return
    
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          handleSubmitExam()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    
    return () => clearInterval(timer)
  }, [isAuthorized, timeRemaining])
  
  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }))
  }
  
  const handleNextQuestion = () => {
    if (data?.data && currentQuestionIndex < data.data.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
    }
  }
  
  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1)
    }
  }
  
  const handleSubmitExam = async () => {
    if (isSubmitting) return
    
    setIsSubmitting(true)
    try {
      const response = await clientAPI.post(`/exam/${params.id}/submit`, {
        answers,
        exam_code: examCode
      })
      
      toast.success("Exam submitted successfully")
      router.push(`/exam/${params.id}/result?code=${examCode}`)
    } catch (err) {
      console.error(err)
      errorHandler(err)
      setIsSubmitting(false)
    }
  }
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center size-full">
        <Loading />
      </div>
    )
  }
  
  if (!data?.data) {
    return (
      <div className="flex justify-center items-center size-full">
        <NotFound content={params.id} />
      </div>
    )
  }
  
  if (!isAuthorized) {
    return (
      <div className="flex justify-center items-center size-full">
        <Card className="max-w-md">
          <CardHeader className="flex flex-col gap-1">
            <h1 className="text-xl font-bold">Access Denied</h1>
          </CardHeader>
          <CardBody>
            <p>You are not authorized to take this exam. Please make sure you have the correct exam code.</p>
            <Button 
              color="primary" 
              className="mt-4"
              onPress={() => router.push("/overview")}
            >
              Return to Overview
            </Button>
          </CardBody>
        </Card>
      </div>
    )
  }
  
  const currentQuestion = data.data.questions[currentQuestionIndex]
  const progress = ((currentQuestionIndex + 1) / data.data.questions.length) * 100
  const minutes = Math.floor(timeRemaining / 60)
  const seconds = timeRemaining % 60
  
  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{data.data.exam_name}</h1>
        <div className="text-xl font-mono">
          {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
        </div>
      </div>
      
      <Progress 
        value={progress} 
        className="mb-6"
        color="primary"
        showValueLabel={true}
        formatOptions={{ style: 'percent' }}
      />
      
      <Card className="mb-6">
        <CardHeader className="flex justify-between">
          <h2 className="text-xl font-semibold">
            Question {currentQuestionIndex + 1} of {data.data.questions.length}
          </h2>
        </CardHeader>
        <CardBody>
          <div className="space-y-6">
            <div className="text-lg">
              {currentQuestion.question_text}
            </div>
            
            <RadioGroup
              value={answers[currentQuestion.id] || ""}
              onValueChange={(value) => handleAnswerChange(currentQuestion.id, value)}
            >
              {currentQuestion.options.map((option, index) => (
                <Radio key={index} value={option.id}>
                  {option.text}
                </Radio>
              ))}
            </RadioGroup>
            
            <div className="flex justify-between mt-8">
              <Button
                color="primary"
                variant="flat"
                onPress={handlePrevQuestion}
                isDisabled={currentQuestionIndex === 0}
              >
                Previous
              </Button>
              
              {currentQuestionIndex === data.data.questions.length - 1 ? (
                <Button
                  color="success"
                  onPress={handleSubmitExam}
                  isLoading={isSubmitting}
                >
                  Submit Exam
                </Button>
              ) : (
                <Button
                  color="primary"
                  onPress={handleNextQuestion}
                >
                  Next
                </Button>
              )}
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  )
} 