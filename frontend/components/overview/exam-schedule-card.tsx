import { Button, Chip, Tooltip, useDisclosure } from "@nextui-org/react"
import { MdiBin, MdiPaper, UisSchedule } from "@/components/icons/icons"
import ExamPasswordModal from "./modals/exam-password-modal"
import { useRouter } from "nextjs-toploader/app"

interface ExamSetting {
  _id: string
  exam_code: string
  exam_id: string
  open_time: Date
  close_time: Date
  allowed_attempts: number
  allowed_review: boolean
  show_answer: boolean
  randomize_question: boolean
  ip_range?: string
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

  const handleCardClick = (e: React.MouseEvent) => {
    // Prevent opening modal when clicking delete button
    if ((e.target as HTMLElement).closest('button')) {
      return
    }
    onOpen()
  }

  return (
    <>
      <div 
        className="bg-gradient-to-r from-secondary/5 to-primary/5 rounded-xl overflow-hidden shadow-sm border border-secondary/10 cursor-pointer hover:shadow-md transition-shadow"
        onClick={handleCardClick}
      >
        <div className="bg-secondary/10 px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-secondary text-white p-1.5 rounded-full">
              <UisSchedule fontSize={16} />
            </div>
            <h4 className="font-medium">Exam #{index + 1}</h4>
          </div>
          <div className="flex items-center gap-1">
            <Chip size="sm" color="primary" variant="flat" className="font-mono">
              {setting.exam_code}
            </Chip>
            {isStudent ? null : <Tooltip content="Learner exam submitted">
              <Button
                isIconOnly
                size="sm"
                variant="light"
                onPress={() => router.push(`/exam/submitted?id=${setting.exam_id}`)}
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
            <span className="font-mono text-sm">{setting.exam_id}</span>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-secondary/10 p-3 rounded-lg">
              <div className="text-xs font-medium text-gray-500 mb-1">OPENS</div>
              <div className="text-sm">{setting.open_time.toLocaleString()}</div>
            </div>
            <div className="bg-secondary/10 p-3 rounded-lg">
              <div className="text-xs font-medium text-gray-500 mb-1">CLOSES</div>
              <div className="text-sm">{setting.close_time.toLocaleString()}</div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-3">
            <Chip size="sm" variant="flat" color="default">
              {setting.allowed_attempts} attempt{setting.allowed_attempts !== 1 ? 's' : ''}
            </Chip>
            <Chip size="sm" variant="flat" color={setting.allowed_review ? "success" : "danger"}>
              {setting.allowed_review ? 'Review allowed' : 'No review'}
            </Chip>
            <Chip size="sm" variant="flat" color={setting.show_answer ? "success" : "danger"}>
              {setting.show_answer ? 'Show answers' : 'Hide answers'}
            </Chip>
            <Chip size="sm" variant="flat" color={setting.randomize_question ? "warning" : "default"}>
              {setting.randomize_question ? 'Random questions' : 'Fixed order'}
            </Chip>
          </div>

          {setting.ip_range && (
            <div className="mt-3 text-xs">
              <span className="font-medium text-gray-500">IP RANGE: </span>
              <span className="font-mono">{setting.ip_range}</span>
            </div>
          )}
        </div>
      </div>

      <ExamPasswordModal
        courseId={courseId}
        groupId={groupId}
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        examId={setting.exam_id}
        examCode={setting.exam_code}
        settingId={setting._id}
      />
    </>
  )
}
