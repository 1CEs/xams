"use client"

import { useState, useEffect, FormEvent } from "react"
import { 
  Button, 
  Card, 
  CardBody,
  CardHeader,
  Divider,
  Input,
  Select,
  SelectItem,
  Switch,
  Breadcrumbs,
  BreadcrumbItem,
  Spinner,
  Checkbox,
  Badge,
  Chip,
  ScrollShadow
} from "@nextui-org/react"
import { 
  UisSchedule,
  HealthiconsIExamMultipleChoice,
  MdiBin,
  MingcuteAddFill,
  MaterialSymbolsListAlt,
  PajamasFalsePositive,
  CarbonTextLongParagraph,
  IconParkTwotoneNestedArrows,
  IconParkOutlineCheckCorrect,
} from "@/components/icons/icons"
import ExamSelectorModal from "@/components/overview/exam-selector"
import { useRouter } from "nextjs-toploader/app"
import { useSearchParams } from "next/navigation"
import { clientAPI } from '@/config/axios.config'
import { useTrigger } from '@/stores/trigger.store'
import { useUserStore } from '@/stores/user.store'
import { errorHandler } from '@/utils/error'
import { toast } from 'react-toastify'

interface Question {
  _id: string
  question: string
  type: 'multiple-choice' | 'true-false' | 'short-answer' | 'nested'
  score: number
  choices?: {
    content: string
    isCorrect: boolean
    score: number
  }[]
  isTrue?: boolean
  expectedAnswer?: string
  maxWords?: number
  questions?: Question[]
}

interface Examination {
  _id: string
  title: string
  description: string
  instructor_id: string
  questions?: Question[]
  folder?: string
}

interface ExamFolder {
  name: string
  exams: Examination[]
}

interface SelectedQuestion extends Question {
  examId: string
  examTitle: string
}

export default function CreateSchedulePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const courseId = searchParams.get('courseId') || ""
  const groupId = searchParams.get('groupId') || ""
  
  const { trigger, setTrigger } = useTrigger()
  const { user } = useUserStore()
  const [examinations, setExaminations] = useState<Examination[]>([])
  const [examFolders, setExamFolders] = useState<ExamFolder[]>([])
  const [groups, setGroups] = useState<{ group_name: string; _id?: string }[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedGroup, setSelectedGroup] = useState<string>('')
  const [submitting, setSubmitting] = useState<boolean>(false)
  const [selectedExamQuestionCount, setSelectedExamQuestionCount] = useState<number>(0)
  const [selectedQuestions, setSelectedQuestions] = useState<SelectedQuestion[]>([])
  const [currentStep, setCurrentStep] = useState<'exam' | 'questions'>('exam')
  
  // Modal state
  const [isExamModalOpen, setIsExamModalOpen] = useState<boolean>(false)
  const [selectedExams, setSelectedExams] = useState<string[]>([])
  
  // Helper function to format Date objects for datetime-local input
  const formatDateForInput = (date: Date): string => {
    // Format: YYYY-MM-DDThh:mm
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Helper functions for question types
  const getQuestionTypeIcon = (type: string) => {
    switch (type) {
      case 'multiple-choice':
        return <HealthiconsIExamMultipleChoice className="w-4 h-4" />
      case 'true-false':
        return <PajamasFalsePositive className="w-4 h-4" />
      case 'short-answer':
        return <CarbonTextLongParagraph className="w-4 h-4" />
      case 'nested':
        return <IconParkTwotoneNestedArrows className="w-4 h-4" />
      default:
        return <HealthiconsIExamMultipleChoice className="w-4 h-4" />
    }
  }

  const getQuestionTypeLabel = (type: string) => {
    switch (type) {
      case 'multiple-choice':
        return 'Multiple Choice'
      case 'true-false':
        return 'True/False'
      case 'short-answer':
        return 'Short Answer'
      case 'nested':
        return 'Nested Questions'
      default:
        return 'Unknown'
    }
  }

  const removeSelectedQuestion = (questionId: string, examId: string) => {
    setSelectedQuestions(prev => 
      prev.filter(q => !(q._id === questionId && q.examId === examId))
    )
  }
  
  const [examSettingForm, setExamSettingForm] = useState({
    exam_ids: [] as string[],  // Multiple exam IDs
    schedule_name: '',  // Custom name for the schedule
    open_time: new Date(),
    close_time: new Date(Date.now() + 24 * 60 * 60 * 1000), // Default to 24 hours later
    ip_range: '',
    exam_code: '',
    allowed_attempts: 1,
    allowed_review: true,
    show_answer: false,
    randomize_question: true,
    randomize_choice: true,
    question_count: 0  // Number of questions to randomly select
  })
  
  // Fetch available examinations and groups
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        // Fetch examinations
        const examsResponse = await clientAPI.get(`/exam?instructor_id=${user?._id}`)
        if (examsResponse.data && examsResponse.data.data) {
          const exams = examsResponse.data.data as Examination[]
          setExaminations(exams)
          
          // Organize exams into folders
          const folders: Record<string, Examination[]> = {}
          const unfolderedExams: Examination[] = []
          
          exams.forEach(exam => {
            if (exam.folder) {
              if (!folders[exam.folder]) {
                folders[exam.folder] = []
              }
              folders[exam.folder].push(exam)
            } else {
              unfolderedExams.push(exam)
            }
          })
          
          // Convert to array of folders
          const folderArray: ExamFolder[] = Object.keys(folders).map(name => ({
            name,
            exams: folders[name]
          }))
          
          // Add unfolderedExams as a special "No Folder" category if there are any
          if (unfolderedExams.length > 0) {
            folderArray.unshift({
              name: 'No Folder',
              exams: unfolderedExams
            })
          }
          
          setExamFolders(folderArray)
        }
        
        // Fetch groups for the course
        if (courseId) {
          const groupsResponse = await clientAPI.get(`/course/${courseId}`)
          const groups = groupsResponse.data.data.groups
          if (groups) {
            setGroups(groups)
            if (groups.length > 0) {
              // If groupId is provided in URL, use that, otherwise use first group
              if (groupId) {
                const foundGroup = groups.find((g: any) => g._id === groupId)
                if (foundGroup) {
                  setSelectedGroup(foundGroup.group_name)
                } else {
                  setSelectedGroup(groups[0].group_name)
                }
              } else {
                setSelectedGroup(groups[0].group_name)
              }
            }
          }
        }
      } catch (err) {
        console.error('Error fetching data:', err)
        errorHandler(err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [courseId, groupId, user?._id])
  
  const getSelectedExamsTitle = (): string => {
    if (examSettingForm.exam_ids.length === 0) {
      return 'Select exams'
    } else if (examSettingForm.exam_ids.length === 1) {
      const exam = examinations.find(e => e._id === examSettingForm.exam_ids[0])
      return exam ? exam.title : 'Selected exam'
    } else {
      return `${examSettingForm.exam_ids.length} exams selected`
    }
  }

  const handleExamSelectionChange = (updatedExamIds: string[]) => {
    setExamSettingForm({
      ...examSettingForm,
      exam_ids: updatedExamIds
    });
    setSelectedExams(updatedExamIds);
    
    // Update question count based on the first selected exam
    if (updatedExamIds.length > 0) {
      const firstExam = examinations.find(e => e._id === updatedExamIds[0]);
      const questionCount = firstExam?.questions?.length || 0;
      setExamSettingForm(prev => ({
        ...prev,
        exam_ids: updatedExamIds,
        question_count: questionCount
      }));
      setSelectedExamQuestionCount(questionCount);
    } else {
      setExamSettingForm(prev => ({
        ...prev,
        exam_ids: updatedExamIds,
        question_count: 0
      }));
      setSelectedExamQuestionCount(0);
    }
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    
    // Validate exam_ids is selected
    if (examSettingForm.exam_ids.length === 0) {
      setError('Please select at least one examination')
      setSubmitting(false)
      return
    }
    
    // Validate question count
    if (examSettingForm.question_count < 1 || examSettingForm.question_count > selectedExamQuestionCount) {
      setError(`Please enter a valid number of questions (1-${selectedExamQuestionCount})`)
      setSubmitting(false)
      return
    }
    
    try {
      // Format dates to ISO strings for API
      const formattedForm = {
        ...examSettingForm,
        open_time: examSettingForm.open_time.toISOString(),
        close_time: examSettingForm.close_time.toISOString()
      }

      // For now, we'll use the first exam ID if multiple are selected
      // In the future, you might want to handle multiple exams differently
      const postData = {
        ...formattedForm,
        exam_id: formattedForm.exam_ids[0] // API still expects a single exam_id
      }

      const res = await clientAPI.post(
        `/course/${courseId}/group/${encodeURIComponent(selectedGroup)}/exam-setting`, 
        postData
      )
      
      toast.success('Examination schedule created successfully')
      setTrigger(!trigger)
      
      // Navigate back to the schedules page
      router.push('/overview/create/schedule')
    } catch (err: any) {
      console.error('Error creating examination schedule:', err)
      
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message)
      } else {
        errorHandler(err)
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* Header with breadcrumbs */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <Breadcrumbs size="sm" className="mb-2">
            <BreadcrumbItem href="/overview">Overview</BreadcrumbItem>
            <BreadcrumbItem href="/overview/create/schedule">Schedules</BreadcrumbItem>
            <BreadcrumbItem>Create Schedule</BreadcrumbItem>
          </Breadcrumbs>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <UisSchedule className="text-secondary" />
            Create Exam Schedule
          </h1>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side - Main Form */}
        <div className="lg:col-span-2">
          <Card className="mb-6">
            <CardBody>
              {loading ? (
                <div className="flex justify-center items-center py-20">
                  <Spinner size="lg" color="secondary" />
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {error && (
                    <div className="bg-danger-50 text-danger border border-danger-200 rounded-lg p-4 mb-4">
                      {error}
                    </div>
                  )}
                  
                  {/* Exam Selection */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Button
                        color="secondary"
                        variant="bordered"
                        className="w-full h-14 justify-start px-3"
                        startContent={<HealthiconsIExamMultipleChoice className="text-xl" />}
                        endContent={examSettingForm.exam_ids.length > 0 && <div className="bg-secondary text-white rounded-full px-2 py-1 text-xs">{examSettingForm.exam_ids.length}</div>}
                        onPress={() => setIsExamModalOpen(true)}
                        isDisabled={submitting || examinations.length === 0}
                      >
                        <div className="flex flex-col items-start">
                          <span className="text-sm text-default-500">Select Examination</span>
                          <span>{getSelectedExamsTitle()}</span>
                        </div>
                      </Button>
                    </div>
                    
                    <div>
                      <Select
                        label="Select Group"
                        placeholder="Select a group"
                        isRequired
                        isDisabled={submitting || groups.length === 0}
                        selectedKeys={selectedGroup ? [selectedGroup] : []}
                        onChange={(e) => setSelectedGroup(e.target.value)}
                      >
                        {groups.length > 0 ? (
                          groups.map((group) => (
                            <SelectItem key={group.group_name} value={group.group_name}>
                              {group.group_name}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem key="no-groups" value="">No groups available</SelectItem>
                        )}
                      </Select>
                    </div>
                  </div>
                  
                  {/* Schedule Settings */}
                  <div className="bg-default-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4">Schedule Information</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        type="text"
                        label="Schedule Name"
                        placeholder="Enter a name for this schedule"
                        value={examSettingForm.schedule_name}
                        onChange={(e) => setExamSettingForm({...examSettingForm, schedule_name: e.target.value})}
                        isRequired
                        isDisabled={submitting}
                      />
                      
                      <Input
                        type="text"
                        label="Exam Code"
                        placeholder="Enter exam access code"
                        value={examSettingForm.exam_code}
                        onChange={(e) => setExamSettingForm({...examSettingForm, exam_code: e.target.value})}
                        isRequired
                        isDisabled={submitting}
                      />
                      
                      <Input
                        type="datetime-local"
                        label="Open Time"
                        value={formatDateForInput(examSettingForm.open_time)}
                        onChange={(e) => setExamSettingForm({...examSettingForm, open_time: new Date(e.target.value)})}
                        isRequired
                        isDisabled={submitting}
                      />
                      
                      <Input
                        type="datetime-local"
                        label="Close Time"
                        value={formatDateForInput(examSettingForm.close_time)}
                        onChange={(e) => setExamSettingForm({...examSettingForm, close_time: new Date(e.target.value)})}
                        isRequired
                        isDisabled={submitting}
                      />
                      
                      <Input
                        type="text"
                        label="IP Range (Optional)"
                        placeholder="e.g., 192.168.1.0/24"
                        value={examSettingForm.ip_range}
                        onChange={(e) => setExamSettingForm({...examSettingForm, ip_range: e.target.value})}
                        isDisabled={submitting}
                      />
                      
                      <Input
                        type="number"
                        label="Allowed Attempts"
                        placeholder="1"
                        min={1}
                        description="Number of attempts allowed per student"
                        value={examSettingForm.allowed_attempts.toString()}
                        onChange={(e) => setExamSettingForm({
                          ...examSettingForm, 
                          allowed_attempts: parseInt(e.target.value) || 1
                        })}
                        isDisabled={submitting}
                      />
                    </div>
                  </div>
                  
                  {/* Exam Options */}
                  <div className="bg-default-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4">Exam Options</h3>
                    
                    <div className="flex flex-col gap-4">
                      <Switch
                        isSelected={examSettingForm.allowed_review}
                        onValueChange={(value) => setExamSettingForm({...examSettingForm, allowed_review: value})}
                        isDisabled={submitting}
                      >
                        Allow students to review their answers after submission
                      </Switch>
                      
                      <Switch
                        isSelected={examSettingForm.show_answer}
                        onValueChange={(value) => setExamSettingForm({...examSettingForm, show_answer: value})}
                        isDisabled={submitting}
                      >
                        Show correct answers after submission
                      </Switch>
                      
                      <Switch
                        isSelected={examSettingForm.randomize_question}
                        onValueChange={(value) => setExamSettingForm({...examSettingForm, randomize_question: value})}
                        isDisabled={submitting}
                      >
                        Randomize question order
                      </Switch>
                      
                      <Switch
                        isSelected={examSettingForm.randomize_choice}
                        onValueChange={(value) => setExamSettingForm({...examSettingForm, randomize_choice: value})}
                        isDisabled={submitting}
                      >
                        Randomize answer choices
                      </Switch>
                    </div>
                  </div>
                  
                  {/* Submit Button */}
                  <div className="flex justify-end gap-2">
                    <Button
                      color="danger"
                      variant="light"
                      onPress={() => router.push('/overview/create/schedule')}
                      isDisabled={submitting}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      color="secondary"
                      isLoading={submitting}
                      isDisabled={submitting || selectedQuestions.length === 0 || !selectedGroup}
                    >
                      Create Schedule
                    </Button>
                  </div>
                </form>
              )}
            </CardBody>
          </Card>
        </div>
        
        {/* Right Side - Selected Questions Summary */}
        <div className="lg:col-span-1">
          <Card className="border-none shadow-lg sticky top-6">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <IconParkOutlineCheckCorrect className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold">Selected Questions</h3>
                <Badge color="primary" variant="flat">
                  {selectedQuestions.length}
                </Badge>
              </div>
            </CardHeader>
            <CardBody>
              {selectedQuestions.length === 0 ? (
                <div className="text-center py-8">
                  <MaterialSymbolsListAlt className="w-12 h-12 text-default-300 mx-auto mb-3" />
                  <p className="text-default-500 text-sm">
                    {currentStep === 'exam' 
                      ? 'Select exams to view questions'
                      : 'Select questions to add to your schedule'
                    }
                  </p>
                </div>
              ) : (
                <ScrollShadow className="max-h-[500px]">
                  <div className="space-y-3">
                    {selectedQuestions.map((question, index) => (
                      <Card key={`${question.examId}-${question._id}`} className="border border-default-200">
                        <CardBody className="p-3">
                          <div className="flex items-start gap-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-1 mb-1">
                                {getQuestionTypeIcon(question.type)}
                                <Chip size="sm" variant="flat" color="secondary">
                                  {question.score} pts
                                </Chip>
                              </div>
                              
                              <p className="text-xs font-medium text-primary mb-1">
                                {question.examTitle}
                              </p>
                              
                              <p className="text-sm font-medium line-clamp-2">
                                Q{index + 1}: {question.question}
                              </p>
                              
                              <p className="text-xs text-default-500 mt-1">
                                {getQuestionTypeLabel(question.type)}
                              </p>
                            </div>
                            
                            <Button
                              isIconOnly
                              size="sm"
                              variant="light"
                              color="danger"
                              onPress={() => removeSelectedQuestion(question._id, question.examId)}
                            >
                              <MdiBin className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardBody>
                      </Card>
                    ))}
                  </div>
                </ScrollShadow>
              )}
              
              {selectedQuestions.length > 0 && (
                <div className="mt-4 p-3 bg-primary/10 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Total Score:</span>
                    <Badge color="primary" variant="solid">
                      {selectedQuestions.reduce((total, q) => total + q.score, 0)} pts
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-sm font-medium">Questions:</span>
                    <Badge color="secondary" variant="flat">
                      {selectedQuestions.length}
                    </Badge>
                  </div>
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Exam Selector Modal */}
      <ExamSelectorModal
        isOpen={isExamModalOpen}
        onClose={() => setIsExamModalOpen(false)}
        selectedExamIds={selectedExams}
        onExamSelectionChange={(examIds) => {
          setSelectedExams(examIds);
          handleExamSelectionChange(examIds);
        }}
        allowMultiSelect={true}
        instructorId={user?._id || ''}
      />
    </div>
  );
}