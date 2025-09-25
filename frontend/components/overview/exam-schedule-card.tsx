import { Button, Checkbox, Chip, Tooltip, useDisclosure, Card, CardBody, CardHeader, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Input } from "@nextui-org/react"
import { MdiBin, MdiPaper, UisSchedule, PhEyeDuotone, MaterialSymbolsListAlt, FluentSettings16Filled } from "@/components/icons/icons"
import { useRouter } from "nextjs-toploader/app"
import { useFetch } from "@/hooks/use-fetch"
import { useMemo, useState } from "react"
import { toast } from "react-toastify"
import { useUserStore } from "@/stores/user.store"
import { clientAPI } from "@/config/axios.config"

interface ExamSetting {
  _id: string
  schedule_id: string
}

interface ExamSchedule {
  _id: string
  original_exam_id: string
  instructor_id: string
  title: string
  description?: string
  category?: string[]
  questions: any[]
  created_at: Date
  open_time?: Date
  close_time?: Date
  ip_range?: string
  exam_code?: string
  allowed_attempts: number
  allowed_review: boolean
  show_answer: boolean
  randomize_question: boolean
  randomize_choice: boolean
  question_count: number
  time_taken?: number
}

interface ExamScheduleCardProps {
  courseId: string
  groupId: string
  setting: ExamSetting
  index: number
  groupName: string
  isStudent?: boolean
  onDelete?: (groupId: string, examSettingIndex: number) => void
  onEdit?: (scheduleId: string, courseId: string, groupId: string) => void
  // Selection props for bulk operations
  isSelected?: boolean
  onSelectionChange?: () => void
  showCheckbox?: boolean
}

export default function ExamScheduleCard({ 
  courseId, 
  groupId, 
  setting, 
  index, 
  groupName, 
  isStudent = false, 
  onDelete,
  onEdit,
  isSelected = false,
  onSelectionChange,
  showCheckbox = false
}: ExamScheduleCardProps) {
  const { isOpen: isDetailModalOpen, onOpen: onDetailModalOpen, onOpenChange: onDetailModalChange } = useDisclosure()
  const { isOpen: isAttemptWarningOpen, onOpen: onAttemptWarningOpen, onOpenChange: onAttemptWarningChange } = useDisclosure()
  const { isOpen: isRetakeModalOpen, onOpen: onRetakeModalOpen, onOpenChange: onRetakeModalChange } = useDisclosure()
  const router = useRouter()
  const { user } = useUserStore()
  const [isValidatingAttempt, setIsValidatingAttempt] = useState(false)
  const [attemptInfo, setAttemptInfo] = useState<{ currentAttempts: number; maxAttempts: number; hasCompleted: boolean } | null>(null)

  // Fetch exam schedule data using the schedule_id
  const { data: examSchedule, isLoading, error } = useFetch<{ data: ExamSchedule }>(`/exam-schedule/${setting.schedule_id}`)

  // Count all questions including nested sub-questions
  const countAllQuestions = (questions: any[]) => {
    if (!questions || questions.length === 0) {
      return { total: 0, regular: 0, nested: 0, subQuestions: 0 }
    }

    let regular = 0
    let nested = 0
    let subQuestions = 0

    questions.forEach(question => {
      if (question.type === 'nested' && question.questions && question.questions.length > 0) {
        nested++ // Count nested containers for display purposes
        subQuestions += question.questions.length
      } else {
        regular++
      }
    })

    // Total = regular questions + sub-questions (don't count nested containers)
    const total = regular + subQuestions
    return { total, regular, nested, subQuestions }
  }

  // Get question count details
  const questionCounts = useMemo(() => {
    return countAllQuestions(examSchedule?.data?.questions || [])
  }, [examSchedule?.data?.questions])

  // Check if current user is the instructor who created this exam schedule
  const isInstructor = useMemo(() => {
    return user && examSchedule?.data && user._id === examSchedule.data.instructor_id
  }, [user, examSchedule?.data])

  // Check if exam is currently open
  const examStatus = useMemo(() => {
    if (!examSchedule?.data) return { status: 'loading', message: 'Loading...' }
    
    const schedule = examSchedule.data
    
    // If user is the instructor who created this exam, always allow access
    if (isInstructor) {
      return { status: 'open', message: 'Instructor access - Always available', isInstructorAccess: true }
    }
    
    // If no scheduling is set (immediate access), exam is always open
    if (!schedule.open_time && !schedule.close_time) {
      return { status: 'open', message: 'Immediate access - Always available' }
    }
    
    const now = new Date()
    
    // If only open_time is set (no close_time), check if exam has opened
    if (schedule.open_time && !schedule.close_time) {
      const openTime = new Date(schedule.open_time)
      if (now < openTime) {
        return { status: 'upcoming', message: 'Exam not yet open' }
      } else {
        return { status: 'open', message: 'Exam is open - No end time' }
      }
    }
    
    // If only close_time is set (no open_time), exam is open until close time
    if (!schedule.open_time && schedule.close_time) {
      const closeTime = new Date(schedule.close_time)
      if (now > closeTime) {
        return { status: 'closed', message: 'Exam has closed' }
      } else {
        return { status: 'open', message: 'Exam is open - Started immediately' }
      }
    }
    
    // Both open_time and close_time are set
    if (schedule.open_time && schedule.close_time) {
      const openTime = new Date(schedule.open_time)
      const closeTime = new Date(schedule.close_time)
      
      if (now < openTime) {
        return { status: 'upcoming', message: 'Exam not yet open' }
      } else if (now > closeTime) {
        return { status: 'closed', message: 'Exam has closed' }
      } else {
        return { status: 'open', message: 'Exam is open' }
      }
    }
    
    // Fallback
    return { status: 'open', message: 'Exam is available' }
  }, [examSchedule?.data, isInstructor])

  // Get the schedule data
  const schedule = examSchedule?.data
  if (!schedule) {
    return null
  }

  const validateAttemptEligibility = async (): Promise<boolean> => {
    if (!isStudent || !user?._id) {
      return true // Instructors can always access
    }

    try {
      setIsValidatingAttempt(true)
      
      // First get current attempt count and check completion status
      const attemptCountResponse = await clientAPI.get(`/submission/attempts/${setting.schedule_id}/${user._id}`)
      const currentAttempts = attemptCountResponse.data.data?.count || 0
      
      // Check if student has completed the exam (has any submissions)
      const hasCompleted = currentAttempts > 0
      
      // Then check if student can attempt
      const response = await clientAPI.post('/submission/can-attempt', {
        schedule_id: setting.schedule_id,
        student_id: user._id,
        allowed_attempts: schedule.allowed_attempts
      })

      if (response.data.success && response.data.data.canAttempt) {
        // If student has completed but still can attempt, show retake modal
        if (hasCompleted && schedule.allowed_attempts > 1) {
          setAttemptInfo({
            currentAttempts: currentAttempts,
            maxAttempts: schedule.allowed_attempts,
            hasCompleted: true
          })
          onRetakeModalOpen()
          return false // Don't proceed directly, let user confirm retake
        }
        return true
      } else {
        // Set attempt info and show limit reached modal
        setAttemptInfo({
          currentAttempts: currentAttempts,
          maxAttempts: schedule.allowed_attempts,
          hasCompleted: hasCompleted
        })
        onAttemptWarningOpen()
        return false
      }
    } catch (error) {
      console.error('Error validating attempt eligibility:', error)
      toast.error('Failed to validate exam attempt eligibility')
      return false
    } finally {
      setIsValidatingAttempt(false)
    }
  }

  const handleCardClick = async () => {
    // For instructors who created the exam, always allow access regardless of timing
    if (isInstructor) {
      onDetailModalOpen()
      return
    }
    
    // For students, only allow access if exam is open
    if (isStudent && examStatus.status !== 'open') {
      return
    }
    
    // Always open detail modal first for students
    onDetailModalOpen()
  }

  const handleProceedToExam = async () => {
    // Validate attempt eligibility for students
    if (isStudent) {
      const canAttempt = await validateAttemptEligibility()
      if (!canAttempt) {
        return
      }
    }
    
    // Navigate directly to exam
    router.push(`/exam?schedule_id=${setting.schedule_id}`)
  }

  // Format date and time for better readability
  const formatDateTime = (date: Date) => {
    const dateObj = new Date(date)
    const dateOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }
    const timeOptions: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }
    
    const formattedDate = dateObj.toLocaleDateString('en-US', dateOptions)
    const formattedTime = dateObj.toLocaleTimeString('en-US', timeOptions)
    
    return { date: formattedDate, time: formattedTime }
  }

  // Show loading state
  if (isLoading || !examSchedule?.data) {
    return (
      <div className="bg-gradient-to-br from-background via-default-50 to-primary/10 rounded-2xl overflow-hidden shadow-lg border border-primary/20 p-4 sm:p-6">
        <div className="animate-pulse">
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-xl"></div>
            <div className="flex-1">
              <div className="h-4 sm:h-5 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-lg w-3/4 mb-2"></div>
              <div className="h-2 sm:h-3 bg-gradient-to-r from-default-200 to-default-300 rounded w-1/2"></div>
            </div>
          </div>
          <div className="space-y-2 sm:space-y-3">
            <div className="h-3 sm:h-4 bg-gradient-to-r from-default-200 to-default-300 rounded w-full"></div>
            <div className="h-3 sm:h-4 bg-gradient-to-r from-default-200 to-default-300 rounded w-2/3"></div>
            <div className="flex gap-1 sm:gap-2">
              <div className="h-5 sm:h-6 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-full w-12 sm:w-16"></div>
              <div className="h-5 sm:h-6 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-full w-16 sm:w-20"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="bg-gradient-to-br from-danger/10 via-danger/5 to-background rounded-2xl overflow-hidden shadow-lg border border-danger/30 p-4 sm:p-6">
        <div className="text-center">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-danger to-danger/70 rounded-xl mx-auto mb-3 flex items-center justify-center text-white text-lg sm:text-xl">
            ⚠️
          </div>
          <div className="text-danger font-semibold text-base sm:text-lg mb-1">
            Error Loading Schedule
          </div>
          <div className="text-danger/70 text-xs sm:text-sm">
            Unable to load exam schedule details
          </div>
        </div>
      </div>
    )
  }

  return (
    <Card 
      className={`w-full hover:shadow-md transition-shadow duration-200 ${
        isValidatingAttempt ? 'opacity-70 cursor-wait' : 'cursor-pointer'
      }`}
      isPressable={!isValidatingAttempt}
      onPress={isValidatingAttempt ? undefined : handleCardClick}
    >
      <CardHeader className="pb-2 px-3 sm:px-4 pt-3 sm:pt-4">
        <div className="flex items-start gap-2 sm:gap-3 min-w-0">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <UisSchedule className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
          </div>
          
          <div className="flex flex-col items-start min-w-0 flex-1">
            <h3 className="text-sm sm:text-md text-start font-medium truncate w-full mb-1">{schedule.title}</h3>
            <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
              <Chip
                size="sm"
                variant="flat"
                color={examStatus.status === 'open' ? 'success' : examStatus.status === 'upcoming' ? 'warning' : 'danger'}
                className="text-xs"
              >
                {isValidatingAttempt ? 'VALIDATING...' : examStatus.status.toUpperCase()}
              </Chip>
              {isInstructor && (
                <Chip
                  size="sm"
                  variant="solid"
                  color="secondary"
                  className="text-white text-xs"
                >
                  Creator
                </Chip>
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardBody className="pt-0 space-y-3 px-3 sm:px-4 pb-3 sm:pb-4">
        {schedule.description && (
          <p className="text-xs sm:text-sm text-default-600 line-clamp-2">{schedule.description}</p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {schedule.open_time && (
            <div className="space-y-1">
              <p className="text-xs text-default-500 font-medium">Open Time</p>
              <div className="flex items-center gap-2">
                <UisSchedule className="h-3 w-3 sm:h-4 sm:w-4 text-primary flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-medium truncate">{formatDateTime(schedule.open_time).date}</p>
                  <p className="text-xs text-default-600">{formatDateTime(schedule.open_time).time}</p>
                </div>
              </div>
            </div>
          )}

          {schedule.close_time && (
            <div className="space-y-1">
              <p className="text-xs text-default-500 font-medium">Close Time</p>
              <div className="flex items-center gap-2">
                <UisSchedule className="h-3 w-3 sm:h-4 sm:w-4 text-danger flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-medium truncate">{formatDateTime(schedule.close_time).date}</p>
                  <p className="text-xs text-default-600">{formatDateTime(schedule.close_time).time}</p>
                </div>
              </div>
            </div>
          )}

          {!schedule.open_time && !schedule.close_time && (
            <div className="col-span-1 sm:col-span-2">
              <div className="flex items-center gap-2">
                <UisSchedule className="h-3 w-3 sm:h-4 sm:w-4 text-success flex-shrink-0" />
                <span className="text-xs sm:text-sm text-success font-medium">Always Available</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-1 sm:gap-2">
          <Chip size="sm" variant="flat" className="text-xs">
            {questionCounts.total} Questions
            {questionCounts.nested > 0 && (
              <span className="ml-1 text-warning">({questionCounts.nested} nested)</span>
            )}
          </Chip>
          <Chip size="sm" variant="flat" className="text-xs">
            {schedule.allowed_attempts} Attempts
          </Chip>
          {schedule.allowed_review && (
            <Chip size="sm" variant="flat" color="success" className="text-xs">
              Review
            </Chip>
          )}
          {schedule.show_answer && (
            <Chip size="sm" variant="flat" color="primary" className="text-xs">
              Answers
            </Chip>
          )}
          {schedule.randomize_question && (
            <Chip size="sm" variant="flat" color="warning" className="text-xs">
              Random Q
            </Chip>
          )}
          {schedule.randomize_choice && (
            <Chip size="sm" variant="flat" color="secondary" className="text-xs">
              Random C
            </Chip>
          )}
        </div>

        {schedule.ip_range && (
          <div className="p-2 sm:p-3 bg-warning/10 rounded-lg">
            <div className="text-xs text-default-500 font-medium">IP Restriction:</div>
            <div className="text-xs font-mono break-all">{schedule.ip_range}</div>
          </div>
        )}

        {/* Action buttons at bottom */}
        <div className="flex justify-end gap-1 sm:gap-2 flex-wrap pt-2 border-t border-default-200">
          {!isStudent && (
            <>
              <Tooltip content="View learner submissions">
                <Button
                  isIconOnly
                  size="sm"
                  variant="light"
                  color="secondary"
                  onPress={() => router.push(`/exam/submitted?schedule_id=${setting.schedule_id}`)}
                  className="min-w-unit-8 w-8 h-8 sm:min-w-unit-10 sm:w-10 sm:h-10"
                >
                  <MaterialSymbolsListAlt className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              </Tooltip>
              {onEdit && (
                <Tooltip content="Edit exam schedule">
                  <Button
                    isIconOnly
                    size="sm"
                    variant="light"
                    color="warning"
                    onPress={() => onEdit(setting.schedule_id, courseId, groupId)}
                    className="min-w-unit-8 w-8 h-8 sm:min-w-unit-10 sm:w-10 sm:h-10"
                  >
                    <FluentSettings16Filled className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                </Tooltip>
              )}
              <Tooltip content="Delete exam schedule">
                <Button
                  isIconOnly
                  size="sm"
                  variant="light"
                  color="danger"
                  onPress={() => onDelete?.(groupId, index)}
                  className="min-w-unit-8 w-8 h-8 sm:min-w-unit-10 sm:w-10 sm:h-10"
                >
                  <MdiBin className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              </Tooltip>
            </>
          )}
          
          {isStudent && (
            <Tooltip content="View my submissions">
              <Button
                isIconOnly
                size="sm"
                variant="light"
                color="primary"
                onPress={() => router.push(`/submission-history?schedule_id=${setting.schedule_id}&student_id=${user?._id}`)}
                className="min-w-unit-8 w-8 h-8 sm:min-w-unit-10 sm:w-10 sm:h-10"
              >
                <PhEyeDuotone className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </Tooltip>
          )}
          
          <Button
            size="sm"
            variant={examStatus.status === 'open' ? 'solid' : 'bordered'}
            color={examStatus.status === 'open' ? 'secondary' : 'warning'}
            disabled={isLoading || examStatus.status === 'loading' || (examStatus.status !== 'open' && !isInstructor)}
            onPress={handleCardClick}
            className="font-medium text-xs sm:text-sm px-2 sm:px-3"
          >
            <span className="hidden sm:inline">
              {isLoading ? 'Loading...' : examStatus.status === 'open' ? 'Access Exam' : 'View Details'}
            </span>
            <span className="sm:hidden">
              {isLoading ? 'Loading...' : examStatus.status === 'open' ? 'Access' : 'View'}
            </span>
          </Button>
        </div>
      </CardBody>

      {/* Exam Detail Modal */}
      <Modal isOpen={isDetailModalOpen} onOpenChange={onDetailModalChange} size="2xl" className="mx-2 sm:mx-0">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <UisSchedule className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-semibold">{schedule.title}</h3>
                    <p className="text-sm text-default-500">Exam Schedule Details</p>
                  </div>
                </div>
              </ModalHeader>
              <ModalBody className="px-4 sm:px-6 py-2">
                <div className="space-y-6">
                  {/* Exam Description */}
                  {schedule.description && (
                    <div>
                      <h4 className="font-semibold text-default-700 mb-2">Description</h4>
                      <p className="text-sm text-default-600">{schedule.description}</p>
                    </div>
                  )}

                  {/* Exam Status */}
                  <div>
                    <h4 className="font-semibold text-default-700 mb-2">Status</h4>
                    <div className="flex items-center gap-2">
                      <Chip
                        size="sm"
                        variant="flat"
                        color={examStatus.status === 'open' ? 'success' : examStatus.status === 'upcoming' ? 'warning' : 'danger'}
                      >
                        {examStatus.status.toUpperCase()}
                      </Chip>
                      <span className="text-sm text-default-600">{examStatus.message}</span>
                    </div>
                  </div>

                  {/* Schedule Information */}
                  <div>
                    <h4 className="font-semibold text-default-700 mb-3">Schedule</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {schedule.open_time ? (
                        <div className="flex items-center gap-3 p-3 bg-success/10 rounded-lg">
                          <UisSchedule className="h-4 w-4 text-success flex-shrink-0" />
                          <div>
                            <p className="text-xs text-success font-medium">Opens</p>
                            <p className="text-sm font-medium">{formatDateTime(schedule.open_time).date}</p>
                            <p className="text-xs text-default-600">{formatDateTime(schedule.open_time).time}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 p-3 bg-success/10 rounded-lg">
                          <UisSchedule className="h-4 w-4 text-success flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-success">Always Available</p>
                            <p className="text-xs text-default-600">No start time restriction</p>
                          </div>
                        </div>
                      )}

                      {schedule.close_time ? (
                        <div className="flex items-center gap-3 p-3 bg-danger/10 rounded-lg">
                          <UisSchedule className="h-4 w-4 text-danger flex-shrink-0" />
                          <div>
                            <p className="text-xs text-danger font-medium">Closes</p>
                            <p className="text-sm font-medium">{formatDateTime(schedule.close_time).date}</p>
                            <p className="text-xs text-default-600">{formatDateTime(schedule.close_time).time}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 p-3 bg-primary/10 rounded-lg">
                          <UisSchedule className="h-4 w-4 text-primary flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-primary">No End Time</p>
                            <p className="text-xs text-default-600">Available indefinitely</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Exam Settings */}
                  <div>
                    <h4 className="font-semibold text-default-700 mb-3">Exam Settings</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                      <div className="text-center p-3 bg-default-50 rounded-lg">
                        <p className="text-2xl font-bold text-primary">{questionCounts.total}</p>
                        <p className="text-xs text-default-600">Total Questions</p>
                      </div>
                      <div className="text-center p-3 bg-default-50 rounded-lg">
                        <p className="text-2xl font-bold text-secondary">{schedule.allowed_attempts}</p>
                        <p className="text-xs text-default-600">Attempts</p>
                      </div>
                      <div className="text-center p-3 bg-default-50 rounded-lg">
                        <p className="text-2xl font-bold text-orange-500">{schedule.time_taken || 60}</p>
                        <p className="text-xs text-default-600">Minutes</p>
                      </div>
                      <div className="text-center p-3 bg-default-50 rounded-lg">
                        <p className="text-lg font-bold text-success">{schedule.allowed_review ? '✓' : '✗'}</p>
                        <p className="text-xs text-default-600">Review</p>
                      </div>
                      <div className="text-center p-3 bg-default-50 rounded-lg">
                        <p className="text-lg font-bold text-warning">{schedule.show_answer ? '✓' : '✗'}</p>
                        <p className="text-xs text-default-600">Show Answers</p>
                      </div>
                    </div>
                  </div>

                  {/* Question Breakdown */}
                  {(questionCounts.nested > 0 || questionCounts.regular > 0) && (
                    <div>
                      <h4 className="font-semibold text-default-700 mb-3">Question Breakdown</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="text-center p-3 bg-primary/10 rounded-lg">
                          <p className="text-xl font-bold text-primary">{questionCounts.total}</p>
                          <p className="text-xs text-default-600">Total Questions</p>
                        </div>
                        {questionCounts.regular > 0 && (
                          <div className="text-center p-3 bg-secondary/10 rounded-lg">
                            <p className="text-xl font-bold text-secondary">{questionCounts.regular}</p>
                            <p className="text-xs text-default-600">Regular Questions</p>
                          </div>
                        )}
                        {questionCounts.nested > 0 && (
                          <div className="text-center p-3 bg-warning/10 rounded-lg">
                            <p className="text-xl font-bold text-warning">{questionCounts.nested}</p>
                            <p className="text-xs text-default-600">Nested Questions</p>
                          </div>
                        )}
                        {questionCounts.subQuestions > 0 && (
                          <div className="text-center p-3 bg-success/10 rounded-lg">
                            <p className="text-xl font-bold text-success">{questionCounts.subQuestions}</p>
                            <p className="text-xs text-default-600">Sub-Questions</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Additional Features */}
                  <div>
                    <h4 className="font-semibold text-default-700 mb-3">Features</h4>
                    <div className="flex flex-wrap gap-2">
                      {schedule.randomize_question && (
                        <Chip size="sm" variant="flat" color="warning">
                          Randomized Questions
                        </Chip>
                      )}
                      {schedule.randomize_choice && (
                        <Chip size="sm" variant="flat" color="secondary">
                          Randomized Choices
                        </Chip>
                      )}
                      {schedule.ip_range && (
                        <Chip size="sm" variant="flat" color="danger">
                          IP Restricted
                        </Chip>
                      )}
                      {schedule.exam_code && (
                        <Chip size="sm" variant="flat" color="primary">
                          Password Protected
                        </Chip>
                      )}
                    </div>
                  </div>

                  {/* IP Restriction Details */}
                  {schedule.ip_range && (
                    <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg">
                      <h4 className="font-semibold text-warning mb-2">IP Restriction</h4>
                      <p className="text-sm text-default-600 mb-1">This exam can only be accessed from:</p>
                      <p className="text-sm font-mono bg-white/50 p-2 rounded border">{schedule.ip_range}</p>
                    </div>
                  )}

                  {/* Exam Code Input */}
                  {schedule.exam_code && schedule.exam_code.trim() !== '' && (
                    <div className="border-t pt-4">
                      <h4 className="font-semibold text-default-700 mb-3">Access Code Required</h4>
                      <Input
                        autoFocus
                        label="Exam Code"
                        placeholder="Enter access code to proceed"
                        variant="bordered"
                        size="sm"
                        id="exam-access-code"
                        onKeyDown={async (e) => {
                          if (e.key === 'Enter') {
                            const input = e.target as HTMLInputElement
                            if (input.value.trim() === schedule.exam_code) {
                              await handleProceedToExam()
                              onClose()
                            } else {
                              toast.error("Invalid code")
                              input.value = ''
                            }
                          }
                        }}
                      />
                    </div>
                  )}
                </div>
              </ModalBody>
              <ModalFooter className="px-4 sm:px-6 pb-4 sm:pb-6 pt-2">
                <Button 
                  color="danger" 
                  variant="light" 
                  onPress={onClose}
                  size="sm"
                >
                  Cancel
                </Button>
                
                {schedule.exam_code && schedule.exam_code.trim() !== '' ? (
                  <Button 
                    color="secondary"
                    isLoading={isValidatingAttempt}
                    size="sm"
                    onPress={async () => {
                      const input = document.getElementById('exam-access-code') as HTMLInputElement
                      if (input?.value.trim() === schedule.exam_code) {
                        await handleProceedToExam()
                        onClose()
                      } else {
                        toast.error("Invalid code")
                        if (input) input.value = ''
                      }
                    }}
                  >
                    {isValidatingAttempt ? 'Validating...' : 'Start Exam'}
                  </Button>
                ) : (
                  <Button 
                    color="secondary"
                    isLoading={isValidatingAttempt}
                    size="sm"
                    disabled={examStatus.status !== 'open' && !isInstructor}
                    onPress={async () => {
                      await handleProceedToExam()
                      onClose()
                    }}
                  >
                    {isValidatingAttempt ? 'Validating...' : 'Start Exam'}
                  </Button>
                )}
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Attempt Warning Modal */}
      <Modal 
        isOpen={isAttemptWarningOpen} 
        onOpenChange={onAttemptWarningChange}
        size="md"
        backdrop="blur"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-danger to-danger/70 rounded-xl flex items-center justify-center text-white text-xl">
                    ⚠️
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-danger">Attempt Limit Reached</h3>
                    <p className="text-sm text-default-500">You cannot access this exam</p>
                  </div>
                </div>
              </ModalHeader>
              <ModalBody>
                <div className="space-y-4">
                  <div className="bg-danger/10 border border-danger/20 rounded-lg p-4">
                    <h4 className="font-semibold text-danger mb-2">Exam Attempt Status</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-default-600">Exam Title:</span>
                        <span className="font-medium">{schedule.title}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-default-600">Your Attempts:</span>
                        <span className="font-medium text-danger">{attemptInfo?.currentAttempts || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-default-600">Maximum Allowed:</span>
                        <span className="font-medium">{attemptInfo?.maxAttempts || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-default-600">Remaining Attempts:</span>
                        <span className="font-medium text-danger">0</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-default-50 border border-default-200 rounded-lg p-4">
                    <h4 className="font-semibold text-default-700 mb-2">What can you do?</h4>
                    <ul className="text-sm text-default-600 space-y-1">
                      <li>• Contact your instructor for assistance</li>
                      <li>• Check if there are other exam schedules available</li>
                      <li>• Review your previous submissions if allowed</li>
                    </ul>
                  </div>
                </div>
              </ModalBody>
              <ModalFooter>
                <div className="flex flex-col gap-2 w-full">
                  <Button 
                    color="secondary" 
                    onPress={() => {
                      router.push(`/submission-history?schedule_id=${setting.schedule_id}&student_id=${user?._id}`)
                      onClose()
                    }}
                    className="w-full"
                  >
                    View Submission History
                  </Button>
                  <Button 
                    color="secondary" 
                    variant="light"
                    onPress={onClose}
                    className="w-full"
                  >
                    I Understand
                  </Button>
                </div>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Retake Confirmation Modal */}
      <Modal 
        isOpen={isRetakeModalOpen} 
        onOpenChange={onRetakeModalChange}
        size="xl"
        backdrop="blur"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-warning to-warning/70 rounded-xl flex items-center justify-center text-white text-xl">
                    🔄
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-warning">Retake Exam</h3>
                    <p className="text-sm text-default-500">You have already completed this exam</p>
                  </div>
                </div>
              </ModalHeader>
              <ModalBody>
                <div className="space-y-4">
                  <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
                    <h4 className="font-semibold text-warning mb-2">Exam Status</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-default-600">Exam Title:</span>
                        <span className="font-medium">{schedule.title}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-default-600">Previous Attempts:</span>
                        <span className="font-medium text-warning">{attemptInfo?.currentAttempts || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-default-600">Maximum Allowed:</span>
                        <span className="font-medium">{attemptInfo?.maxAttempts || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-default-600">Remaining Attempts:</span>
                        <span className="font-medium text-success">
                          {(attemptInfo?.maxAttempts || 0) - (attemptInfo?.currentAttempts || 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-success/10 border border-success/20 rounded-lg p-4">
                    <h4 className="font-semibold text-success mb-2">Good news!</h4>
                    <p className="text-sm text-default-600">
                      Your instructor has allowed multiple attempts for this exam. You can retake it to improve your score.
                    </p>
                  </div>

                  <div className="bg-default-50 border border-default-200 rounded-lg p-4">
                    <h4 className="font-semibold text-default-700 mb-2">Important Notes:</h4>
                    <ul className="text-sm text-default-600 space-y-1">
                      <li>• Your new submission may replace your previous score</li>
                      <li>• Make sure you have adequate time to complete the exam</li>
                      <li>• Review the exam settings before proceeding</li>
                    </ul>
                  </div>
                </div>
              </ModalBody>
              <ModalFooter>
                <div className="flex gap-2 w-full">
                  <Button 
                    color="secondary" 
                    variant="light"
                    onPress={() => {
                      router.push(`/submission-history?schedule_id=${setting.schedule_id}&student_id=${user?._id}`)
                      onClose()
                    }}
                    className="flex-1"
                  >
                    View Previous Attempts
                  </Button>
                  <Button 
                    color="danger" 
                    variant="light"
                    onPress={onClose}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button 
                    color="warning"
                    onPress={() => {
                      router.push(`/exam?schedule_id=${setting.schedule_id}`)
                      onClose()
                    }}
                    className="flex-1"
                  >
                    Retake Exam
                  </Button>
                </div>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </Card>
  )
}
