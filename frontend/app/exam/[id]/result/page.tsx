"use client"

import { useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { useFetch } from "@/hooks/use-fetch"
import Loading from "@/components/state/loading"
import NotFound from "@/components/state/not-found"
import { Button, Card, CardBody, CardHeader, Progress } from "@nextui-org/react"
import { useRouter } from "next/navigation"
import { toast } from "react-toastify"

export default function ExamResultPage({ params }: { params: { id: string } }) {
  const searchParams = useSearchParams()
  const examCode = searchParams.get("code")
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState(false)
  
  const { data, error, isLoading } = useFetch<ServerResponse<ExamResultResponse>>(`/exam/${params.id}/result?code=${examCode}`)
  
  useEffect(() => {
    // Check if the exam code is valid
    if (examCode && data?.data) {
      setIsAuthorized(true)
    } else if (examCode && !isLoading) {
      toast.error("Invalid exam code or no results found")
      router.push("/overview")
    }
  }, [examCode, data, isLoading, router])
  
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
            <p>You are not authorized to view these results. Please make sure you have the correct exam code.</p>
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
  
  const score = data.data.score
  const totalQuestions = data.data.total_questions
  const correctAnswers = data.data.correct_answers
  const percentage = (score / totalQuestions) * 100
  
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Exam Results</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <h2 className="text-xl font-semibold">Your Score</h2>
        </CardHeader>
        <CardBody>
          <div className="space-y-6">
            <div className="flex flex-col items-center justify-center py-8">
              <Progress 
                value={percentage} 
                className="w-full max-w-md mb-4"
                color={percentage >= 70 ? "success" : percentage >= 50 ? "warning" : "danger"}
                showValueLabel={true}
                formatOptions={{ style: 'percent' }}
              />
              <div className="text-3xl font-bold">
                {score} / {totalQuestions}
              </div>
              <div className="text-lg text-gray-500">
                {correctAnswers} correct answers
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-secondary/10 p-3 rounded-lg">
                <div className="text-xs font-medium text-gray-500 mb-1">TIME TAKEN</div>
                <div className="text-sm">{data.data.time_taken} minutes</div>
              </div>
              <div className="bg-secondary/10 p-3 rounded-lg">
                <div className="text-xs font-medium text-gray-500 mb-1">SUBMITTED</div>
                <div className="text-sm">{new Date(data.data.submitted_at).toLocaleString()}</div>
              </div>
            </div>
            
            <Button 
              color="primary" 
              className="w-full mt-4"
              onPress={() => router.push("/overview")}
            >
              Return to Overview
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  )
} 