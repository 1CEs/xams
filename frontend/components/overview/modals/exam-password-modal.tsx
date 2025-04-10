import { Button, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@nextui-org/react"
import { useState, useEffect } from "react"
import { useRouter } from "nextjs-toploader/app"
import { clientAPI } from "@/config/axios.config"
import { errorHandler } from "@/utils/error"
import { toast } from "react-toastify"

interface ExamPasswordModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  courseId: string
  examId: string
  groupId: string
  examCode: string
  settingId: string
}

export default function ExamPasswordModal({ 
  isOpen, 
  onOpenChange, 
  courseId, 
  examId, 
  groupId, 
  settingId,
  examCode 
}: ExamPasswordModalProps) {
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [examSettings, setExamSettings] = useState<ISetting | null>(null)
  const router = useRouter()

  // Fetch exam settings when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchExamSettings()
    }
  }, [isOpen])

  const fetchExamSettings = async () => {
    try {
      const response = await clientAPI.get(`/course?course_id=${courseId}&group_id=${groupId}&setting_id=${settingId}`)
      if (response.data.code === 200) {
        setExamSettings(response.data.data)
      }
    } catch (err) {
      console.error("Failed to fetch exam settings:", err)
    }
  }

  const checkExamConditions = () => {
    if (!examSettings) {
      toast.error("Could not verify exam settings")
      return false
    }

    const now = new Date()
    const openTime = new Date(examSettings.open_time)
    const closeTime = new Date(examSettings.close_time)

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
    if (examSettings.allowed_attempts <= 0) {
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

      // Verify password with the backend
      const response = await clientAPI.post(`/course/verify?course_id=${courseId}&group_id=${groupId}&setting_id=${settingId}&password=${password}`)
      console.log(response.data)
      if (response.data.code == 200) {
        toast.success("Password verified successfully")
        // Navigate to the exam page
        router.push(`/exam?course_id=${courseId}&group_id=${groupId}&setting_id=${settingId}&code=${password}`)
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
          {examSettings && (
            <div className="mb-4 text-sm">
              <p><strong>Exam Schedule:</strong> {new Date(examSettings.open_time).toLocaleString()} - {new Date(examSettings.close_time).toLocaleString()}</p>
              <p><strong>Allowed Attempts:</strong> {examSettings.allowed_attempts}</p>
              {examSettings.ip_range && <p><strong>IP Range:</strong> {examSettings.ip_range}</p>}
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