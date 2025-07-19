import { Button, Chip, Tooltip, useDisclosure } from "@nextui-org/react"
import { MdiBin, MdiPaper, UisSchedule } from "@/components/icons/icons"
import ExamPasswordModal from "./modals/exam-password-modal"
import { useRouter } from "nextjs-toploader/app"
import { useFetch } from "@/hooks/use-fetch"
import { useMemo } from "react"

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

interface ExamScheduleCardProps {
  courseId: string
  groupId: string
  setting: ExamSetting
  index: number
  groupName: string
  isStudent?: boolean
  onDelete?: (groupName: string, examSettingIndex: number) => void
}

export default function ExamScheduleCard({ courseId, groupId, setting, index, groupName, isStudent = false, onDelete }: ExamScheduleCardProps) {
  const { isOpen, onOpen, onOpenChange } = useDisclosure()
  const router = useRouter()

  // Fetch exam schedule data using the schedule_id
  const { data: examSchedule, isLoading, error } = useFetch<{ data: ExamSchedule }>(`/exam-schedule/${setting.schedule_id}`)

  // Check if exam is currently open
  const examStatus = useMemo(() => {
    if (!examSchedule?.data) return { status: 'loading', message: 'Loading...' }
    
    const now = new Date()
    const openTime = new Date(examSchedule.data.open_time)
    const closeTime = new Date(examSchedule.data.close_time)
    
    if (now < openTime) {
      return { status: 'upcoming', message: 'Exam not yet open' }
    } else if (now > closeTime) {
      return { status: 'closed', message: 'Exam has closed' }
    } else {
      return { status: 'open', message: 'Exam is open' }
    }
  }, [examSchedule?.data])

  const handleCardClick = (e: React.MouseEvent) => {
    // Prevent opening modal when clicking delete button
    if ((e.target as HTMLElement).closest('button')) {
      return
    }
    
    // For students, only allow access if exam is open
    if (isStudent && examStatus.status !== 'open') {
      return
    }
    
    onOpen()
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
      <div className="bg-gradient-to-r from-secondary/5 to-primary/5 rounded-xl overflow-hidden shadow-sm border border-secondary/10 p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-300 rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="bg-gradient-to-r from-red-50 to-red-100 rounded-xl overflow-hidden shadow-sm border border-red-200 p-4">
        <div className="text-red-600 text-sm">
          Error loading exam schedule
        </div>
      </div>
    )
  }

  const schedule = examSchedule.data
  const displayTitle = schedule.title || `Schedule #${index + 1}`
  const openDateTime = formatDateTime(schedule.open_time)
  const closeDateTime = formatDateTime(schedule.close_time)

  return (
    <>
      <div 
        className={`bg-gradient-to-r from-secondary/5 to-primary/5 rounded-xl overflow-hidden shadow-sm border border-secondary/10 transition-all ${
          isStudent && examStatus.status !== 'open' 
            ? 'opacity-60 cursor-not-allowed' 
            : 'cursor-pointer hover:shadow-md'
        }`}
        onClick={handleCardClick}
      >
        <div className="bg-secondary/10 px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-secondary text-white p-1.5 rounded-full">
              <UisSchedule fontSize={16} />
            </div>
            <div className="flex flex-col">
              <h4 className="font-medium">{displayTitle}</h4>
              {isStudent && (
                <span className={`text-xs ${
                  examStatus.status === 'open' ? 'text-green-600' : 
                  examStatus.status === 'upcoming' ? 'text-orange-600' : 'text-red-600'
                }`}>
                  {examStatus.message}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            {isStudent && examStatus.status !== 'open' && (
              <Chip 
                size="sm" 
                color={examStatus.status === 'upcoming' ? 'warning' : 'danger'} 
                variant="flat"
              >
                {examStatus.status === 'upcoming' ? 'Not Open' : 'Closed'}
              </Chip>
            )}
            <Chip size="sm" color="primary" variant="flat" className="font-mono">
              {schedule.exam_code || 'N/A'}
            </Chip>
            {isStudent ? null : <Tooltip content="Learner exam submitted">
              <Button
                isIconOnly
                size="sm"
                variant="light"
                onPress={() => router.push(`/exam/submitted?id=${schedule.original_exam_id}`)}
              >
                <MdiPaper fontSize={16} />
              </Button>
            </Tooltip>}
            {isStudent ? null : (
              <Tooltip content="Delete this exam schedule">
                <Button
                  isIconOnly
                  size="sm"
                  variant="light"
                  color="danger"
                  onPress={() => onDelete?.(groupName, index)}
                >
                  <MdiBin fontSize={16} />
                </Button>
              </Tooltip>
            )}
          </div>
        </div>

        <div className="p-4">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-medium text-gray-500">EXAM ID</span>
            <span className="font-mono text-sm">{schedule.original_exam_id}</span>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-secondary/10 p-3 rounded-lg">
              <div className="text-xs font-medium text-gray-500 mb-1">OPENS</div>
              <div className="text-sm font-medium">{openDateTime.date}</div>
              <div className="text-xs text-gray-600">{openDateTime.time}</div>
            </div>
            <div className="bg-secondary/10 p-3 rounded-lg">
              <div className="text-xs font-medium text-gray-500 mb-1">CLOSES</div>
              <div className="text-sm font-medium">{closeDateTime.date}</div>
              <div className="text-xs text-gray-600">{closeDateTime.time}</div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-3">
            <Chip size="sm" variant="flat" color="default">
              {schedule.allowed_attempts} attempt{schedule.allowed_attempts !== 1 ? 's' : ''}
            </Chip>
            <Chip size="sm" variant="flat" color={schedule.allowed_review ? "success" : "danger"}>
              {schedule.allowed_review ? 'Review allowed' : 'No review'}
            </Chip>
            <Chip size="sm" variant="flat" color={schedule.show_answer ? "success" : "danger"}>
              {schedule.show_answer ? 'Show answers' : 'Hide answers'}
            </Chip>
            <Chip size="sm" variant="flat" color={schedule.randomize_question ? "warning" : "default"}>
              {schedule.randomize_question ? 'Random questions' : 'Fixed order'}
            </Chip>
            {schedule.randomize_choice && (
              <Chip size="sm" variant="flat" color="warning">
                Random choices
              </Chip>
            )}
            {schedule.question_count && (
              <Chip size="sm" variant="flat" color="primary">
                {schedule.question_count} questions
              </Chip>
            )}
          </div>

          {schedule.ip_range && (
            <div className="mt-3 text-xs">
              <span className="font-medium text-gray-500">IP RANGE: </span>
              <span className="font-mono">{schedule.ip_range}</span>
            </div>
          )}
        </div>
      </div>

      <ExamPasswordModal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        scheduleId={setting.schedule_id}
      />
    </>
  )
}
