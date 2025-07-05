"use client"

import { useState, useEffect, FormEvent } from "react"
import { 
  Button, 
  Card, 
  CardBody,
  Divider,
  Input,
  Select,
  SelectItem,
  Switch,
  Breadcrumbs,
  BreadcrumbItem,
  Spinner,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Checkbox
} from "@nextui-org/react"
import { 
  UisSchedule,
  IcRoundFolder,
  HealthiconsIExamMultipleChoice
} from "@/components/icons/icons"
import { useRouter } from "nextjs-toploader/app"
import { useSearchParams } from "next/navigation"
import { clientAPI } from '@/config/axios.config'
import { useTrigger } from '@/stores/trigger.store'
import { useUserStore } from '@/stores/user.store'
import { errorHandler } from '@/utils/error'
import { toast } from 'react-toastify'

interface Examination {
  _id: string
  title: string
  description: string
  instructor_id: string
  questions?: any[]  // To track the number of questions in the exam
  folder?: string    // Optional folder name
}

interface ExamFolder {
  name: string
  exams: Examination[]
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
    <div className="container mx-auto px-4 py-6 max-w-5xl">
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
      
      {/* Main content */}
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
                  
                  {/* Exam Selection Modal */}
                  <Modal 
                    isOpen={isExamModalOpen} 
                    onOpenChange={setIsExamModalOpen}
                    size="3xl"
                    scrollBehavior="inside"
                  >
                    <ModalContent>
                      {(onClose) => (
                        <>
                          <ModalHeader className="flex flex-col gap-1">
                            Select Examinations
                          </ModalHeader>
                          <ModalBody>
                            <div className="space-y-4">
                              {examFolders.map((folder) => (
                                <div key={folder.name} className="border border-[#505050] rounded-lg overflow-hidden">
                                  <div className="bg-default-100 p-3 flex items-center gap-2">
                                    <IcRoundFolder className="text-secondary text-xl" />
                                    <span className="font-medium">{folder.name}</span>
                                    <span className="text-xs text-default-500 ml-2">({folder.exams.length})</span>
                                  </div>
                                  <div className="p-2">
                                    {folder.exams.map((exam) => (
                                      <div key={exam._id} className="p-2 hover:bg-default-100 rounded-md">
                                        <Checkbox
                                          isSelected={examSettingForm.exam_ids.includes(exam._id)}
                                          onValueChange={(isSelected) => {
                                            if (isSelected) {
                                              // Add to selected exams
                                              const updatedExamIds = [...examSettingForm.exam_ids, exam._id];
                                              setExamSettingForm({
                                                ...examSettingForm,
                                                exam_ids: updatedExamIds
                                              });
                                              setSelectedExams(updatedExamIds);
                                              
                                              // Update question count based on the first selected exam
                                              if (updatedExamIds.length === 1) {
                                                const questionCount = exam.questions?.length || 0;
                                                setExamSettingForm(prev => ({
                                                  ...prev,
                                                  question_count: questionCount
                                                }));
                                                setSelectedExamQuestionCount(questionCount);
                                              }
                                            } else {
                                              // Remove from selected exams
                                              const updatedExamIds = examSettingForm.exam_ids.filter(id => id !== exam._id);
                                              setExamSettingForm({
                                                ...examSettingForm,
                                                exam_ids: updatedExamIds
                                              });
                                              setSelectedExams(updatedExamIds);
                                              
                                              // Update question count if we removed the exam that determined the count
                                              if (updatedExamIds.length > 0) {
                                                const firstExam = examinations.find(e => e._id === updatedExamIds[0]);
                                                const questionCount = firstExam?.questions?.length || 0;
                                                setExamSettingForm(prev => ({
                                                  ...prev,
                                                  question_count: questionCount
                                                }));
                                                setSelectedExamQuestionCount(questionCount);
                                              } else {
                                                setExamSettingForm(prev => ({
                                                  ...prev,
                                                  question_count: 0
                                                }));
                                                setSelectedExamQuestionCount(0);
                                              }
                                            }
                                          }}
                                        >
                                          <div className="flex flex-col">
                                            <span className="font-medium">{exam.title}</span>
                                            <span className="text-xs text-default-500">{exam.questions?.length || 0} questions</span>
                                          </div>
                                        </Checkbox>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                              
                              {examFolders.length === 0 && (
                                <div className="text-center py-8 text-default-500">
                                  No examinations available
                                </div>
                              )}
                            </div>
                          </ModalBody>
                          <ModalFooter>
                            <Button color="danger" variant="light" onPress={onClose}>
                              Cancel
                            </Button>
                            <Button color="secondary" onPress={onClose}>
                              Done ({examSettingForm.exam_ids.length} selected)
                            </Button>
                          </ModalFooter>
                        </>
                      )}
                    </ModalContent>
                  </Modal>
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
                      <SelectItem key="no-groups" isDisabled>
                        No groups available
                      </SelectItem>
                    )}
                  </Select>
                </div>
              </div>
              
              {/* Schedule Name */}
              <Input
                type="text"
                label="Schedule Name"
                placeholder="Enter a name for this exam schedule"
                value={examSettingForm.schedule_name}
                onChange={(e) => setExamSettingForm({...examSettingForm, schedule_name: e.target.value})}
                isDisabled={submitting}
              />
              
              {/* Date and Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  type="datetime-local"
                  label="Open Time"
                  placeholder="When the exam opens"
                  value={formatDateForInput(examSettingForm.open_time)}
                  onChange={(e) => {
                    const date = e.target.value ? new Date(e.target.value) : new Date();
                    setExamSettingForm({...examSettingForm, open_time: date});
                  }}
                  isRequired
                  isDisabled={submitting}
                />
                
                <Input
                  type="datetime-local"
                  label="Close Time"
                  placeholder="When the exam closes"
                  value={formatDateForInput(examSettingForm.close_time)}
                  onChange={(e) => {
                    const date = e.target.value ? new Date(e.target.value) : new Date();
                    setExamSettingForm({...examSettingForm, close_time: date});
                  }}
                  isRequired
                  isDisabled={submitting}
                />
              </div>
              
              {/* Security Settings */}
              <div className="bg-default-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">Security Settings</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    type="text"
                    label="IP Range (Optional)"
                    placeholder="e.g., 192.168.1.0/24"
                    description="Restrict access to specific IP addresses"
                    value={examSettingForm.ip_range}
                    onChange={(e) => setExamSettingForm({...examSettingForm, ip_range: e.target.value})}
                    isDisabled={submitting}
                  />
                  
                  <Input
                    type="text"
                    label="Exam Code (Optional)"
                    placeholder="e.g., EXAM123"
                    description="Password to access the exam"
                    value={examSettingForm.exam_code}
                    onChange={(e) => setExamSettingForm({...examSettingForm, exam_code: e.target.value})}
                    isDisabled={submitting}
                  />
                </div>
                
                <div className="mt-4">
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
              
              {/* Question Selection */}
              <div className="bg-default-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">Question Selection</h3>
                
                <Input
                  type="number"
                  label="Number of Questions"
                  placeholder="Enter number of questions"
                  description={`Maximum: ${selectedExamQuestionCount} questions`}
                  min={1}
                  max={selectedExamQuestionCount}
                  value={examSettingForm.question_count.toString()}
                  onChange={(e) => setExamSettingForm({
                    ...examSettingForm, 
                    question_count: parseInt(e.target.value) || 0
                  })}
                  isRequired
                  isDisabled={submitting || selectedExamQuestionCount === 0}
                />
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
                  isDisabled={submitting || examSettingForm.exam_ids.length === 0 || !selectedGroup}
                >
                  Create Schedule
                </Button>
              </div>
            </form>
          )}
        </CardBody>
      </Card>
    </div>
  )
}