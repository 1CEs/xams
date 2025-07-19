import { Button, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@nextui-org/react"
import { useState, useEffect } from "react"
import { useRouter } from "nextjs-toploader/app"
import { clientAPI } from "@/config/axios.config"
import { errorHandler } from "@/utils/error"
import { toast } from "react-toastify"

interface ExamSchedule {
  _id: string
  original_exam_id: string
  instructor_id: string
  title: string
  description?: string
  category?: string[]
  questions: any[]
  created_at: Date
  open_time: Date
  close_time: Date
  ip_range?: string
  exam_code?: string
  allowed_attempts: number
  allowed_review: boolean
  show_answer: boolean
  randomize_question: boolean
  randomize_choice: boolean
  question_count: number
}

interface ExamPasswordModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  scheduleId: string
}

export default function ExamPasswordModal({ 
  isOpen, 
  onOpenChange, 
  scheduleId
}: ExamPasswordModalProps) {
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [examSchedule, setExamSchedule] = useState<ExamSchedule | null>(null)
  const router = useRouter()

  // Fetch exam schedule when modal opens
  useEffect(() => {
    if (isOpen && scheduleId) {
      fetchExamSchedule()
    }
  }, [isOpen, scheduleId])

  const fetchExamSchedule = async () => {
    try {
      const scheduleResponse = await clientAPI.get(`/exam-schedule/${scheduleId}`)
      if (scheduleResponse.data.code === 200) {
        const schedule = scheduleResponse.data.data
        setExamSchedule(schedule)
      }
    } catch (err) {
      console.error("Failed to fetch exam schedule:", err)
    }
  }

  const checkExamConditions = () => {
    if (!examSchedule) {
      toast.error("Could not verify exam settings")
      return false
    }

    const now = new Date()
    const openTime = new Date(examSchedule.open_time)
    const closeTime = new Date(examSchedule.close_time)

    // Check if exam is within time window
    if (now < openTime) {
      toast.error(`This exam is not yet available. It opens at ${openTime.toLocaleString()}`)
      return false
    }

    if (now > closeTime) {
      toast.error(`This exam has closed. It was available until ${closeTime.toLocaleString()}`)
      return false
    }

    // Check if user has remaining attempts
    if (examSchedule.allowed_attempts <= 0) {
      toast.error("You have no remaining attempts for this exam")
      return false
    }

    // IP range check would typically be done on the server side
    // as the client's IP address should be verified by the backend

    return true
  }

  const handleSubmit = async () => {
    if (!password.trim()) {
      toast.error("Please enter the exam password")
      return
    }

    setIsLoading(true)
    try {
      // First check all exam conditions
      if (!checkExamConditions()) {
        setIsLoading(false)
        return
      }

      // Verify password with the backend using schedule ID
      const response = await clientAPI.post(`/exam-schedule/${scheduleId}/verify`, { password })
      console.log(response.data)
      if (response.data.code == 200) {
        toast.success("Password verified successfully")
        // Navigate to the exam page with schedule ID
        router.push(`/exam?schedule_id=${scheduleId}`)
      } else {
        toast.error("Incorrect password")
      }
    } catch (err) {
      console.error(err)
      errorHandler(err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">Enter Examination Password</ModalHeader>
        <ModalBody>
          <p className="text-sm text-gray-500">
            This exam requires a password to access. Please enter the password provided by your instructor.
          </p>
          {examSchedule && (
            <div className="mb-4 text-sm">
              <p><strong>Exam Schedule:</strong> {new Date(examSchedule.open_time).toLocaleString()} - {new Date(examSchedule.close_time).toLocaleString()}</p>
              <p><strong>Allowed Attempts:</strong> {examSchedule.allowed_attempts}</p>
              {examSchedule.ip_range && <p><strong>IP Range:</strong> {examSchedule.ip_range}</p>}
            </div>
          )}
          <Input
            label="Password"
            placeholder="Enter exam password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSubmit()
              }
            }}
          />
        </ModalBody>
        <ModalFooter>
          <Button color="danger" variant="light" onPress={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button color="secondary" onPress={handleSubmit} isLoading={isLoading}>
            Access Exam
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
