import { Button, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@nextui-org/react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { clientAPI } from "@/config/axios.config"
import { errorHandler } from "@/utils/error"
import { toast } from "react-toastify"

interface ExamPasswordModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  examId: string
  examCode: string
}

export default function ExamPasswordModal({ 
  isOpen, 
  onOpenChange, 
  examId, 
  examCode 
}: ExamPasswordModalProps) {
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async () => {
    if (!password.trim()) {
      toast.error("Please enter the exam password")
      return
    }

    setIsLoading(true)
    try {
      // Verify password with the backend
      const response = await clientAPI.post(`/exam/${examId}/verify-password`, {
        password
      })
      
      if (response.data.success) {
        toast.success("Password verified successfully")
        // Navigate to the exam page
        router.push(`/exam/${examId}?code=${examCode}`)
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