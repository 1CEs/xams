"use client"

import { useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { useFetch } from "@/hooks/use-fetch"
import Loading from "@/components/state/loading"
import NotFound from "@/components/state/not-found"
import { Button, Card, CardBody, CardHeader } from "@nextui-org/react"
import { useRouter } from "next/navigation"
import { toast } from "react-toastify"

export default function ExamPage({ params }: { params: { id: string } }) {
  const searchParams = useSearchParams()
  const examCode = searchParams.get("code")
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState(false)
  
  const { data, error, isLoading } = useFetch<ServerResponse<ExamResponse>>(`/exam/${params.id}`)
  
  useEffect(() => {
    // Check if the exam code is valid
    if (examCode && data?.data) {
      if (examCode === data.data.exam_code) {
        setIsAuthorized(true)
      } else {
        toast.error("Invalid exam code")
        router.push("/overview")
      }
    }
  }, [examCode, data, router])
  
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
            <p>You are not authorized to view this exam. Please make sure you have the correct exam code.</p>
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
  
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">{data.data.exam_name}</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <h2 className="text-xl font-semibold">Exam Instructions</h2>
        </CardHeader>
        <CardBody>
          <div className="space-y-4">
            <p>{data.data.instructions}</p>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-secondary/10 p-3 rounded-lg">
                <div className="text-xs font-medium text-gray-500 mb-1">TIME LIMIT</div>
                <div className="text-sm">{data.data.time_limit} minutes</div>
              </div>
              <div className="bg-secondary/10 p-3 rounded-lg">
                <div className="text-xs font-medium text-gray-500 mb-1">QUESTIONS</div>
                <div className="text-sm">{data.data.questions?.length || 0} questions</div>
              </div>
            </div>
            
            <Button 
              color="primary" 
              size="lg"
              className="w-full"
              onPress={() => {
                // Start the exam
                router.push(`/exam/${params.id}/take?code=${examCode}`)
              }}
            >
              Start Exam
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  )
} 