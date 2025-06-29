import { clientAPI } from '@/config/axios.config'
import { useTrigger } from '@/stores/trigger.store'
import { useUserStore } from '@/stores/user.store'
import { errorHandler } from '@/utils/error'
import { 
  ModalContent, 
  ModalHeader, 
  ModalBody, 
  ModalFooter, 
  Button, 
  Input, 
  Switch, 
  Select, 
  SelectItem,
  Chip,
  Divider,
  Card,
  CardBody
} from '@nextui-org/react'
import React, { FormEvent, useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { UisSchedule } from '@/components/icons/icons'

type Props = {
  courseId: string
  groups: { group_name: string }[]
  initialGroupName?: string
}

interface Examination {
  _id: string
  title: string
  description: string
  instructor_id: string
  questions?: any[]  // To track the number of questions in the exam
}

const ExamScheduleModal = ({ courseId, groups, initialGroupName }: Props) => {
  const { trigger, setTrigger } = useTrigger()
  const [examinations, setExaminations] = useState<Examination[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedGroup, setSelectedGroup] = useState<string>(initialGroupName || (groups.length > 0 ? groups[0].group_name : ''))
  const [submitting, setSubmitting] = useState<boolean>(false)
  const [selectedExamQuestionCount, setSelectedExamQuestionCount] = useState<number>(0)
  
  const { user } = useUserStore()
  
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
    exam_id: '',
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
  
  // Fetch available examinations
  useEffect(() => {
    const fetchExaminations = async () => {
      try {
        setLoading(true)
        const response = await clientAPI.get(`/exam?instructor_id=${user?._id}`)
        if (response.data && response.data.data) {
          setExaminations(response.data.data)
        }
      } catch (err) {
        console.error('Error fetching examinations:', err)
        errorHandler(err)
      } finally {
        setLoading(false)
      }
    }

    fetchExaminations()
  }, [])

  const getExamTitle = (examId: string): string => {
    const exam = examinations.find(e => e._id === examId)
    return exam ? exam.title : 'Select an exam'
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    
    // Validate exam_id is selected
    if (!examSettingForm.exam_id) {
      setError('Please select an examination')
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

      const res = await clientAPI.post(
        `/course/${courseId}/group/${encodeURIComponent(selectedGroup)}/exam-setting`, 
        formattedForm
      )
      
      toast.success('Examination schedule created successfully')
      setTrigger(!trigger)
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
    <ModalContent>
      {(onClose) => (
        <form onSubmit={handleSubmit}>
          <ModalHeader className="flex flex-col gap-1">
            <h1>Examination Schedule</h1>
            <p className="text-sm text-default-500">Create an examination schedule for a group</p>
          </ModalHeader>
          <ModalBody>
            {error && (
              <Chip color="danger" variant="flat" className="mb-2">
                {error}
              </Chip>
            )}
            
            <Select
              label="Select Group"
              placeholder="Choose a group"
              isRequired
              selectedKeys={[selectedGroup]}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="mb-4"
            >
              {groups.map((group) => (
                <SelectItem key={group.group_name} value={group.group_name}>
                  {group.group_name}
                </SelectItem>
              ))}
            </Select>
            
            <Card className="bg-gradient-to-r from-secondary/5 to-primary/5 shadow-sm border border-secondary/10 mb-4">
              <CardBody className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="bg-secondary text-white p-1.5 rounded-full">
                    <UisSchedule fontSize={16} />
                  </div>
                  <h2 className="text-medium font-medium">Examination Details</h2>
                </div>
                
                <Select
                  label="Select Examination"
                  placeholder="Choose an examination"
                  isRequired
                  isLoading={loading}
                  selectedKeys={examSettingForm.exam_id ? [examSettingForm.exam_id] : []}
                  onChange={async (e) => {
                    const examId = e.target.value;
                    setExamSettingForm(prev => ({ 
                      ...prev, 
                      exam_id: examId,
                      question_count: 0 // Reset question count when exam changes
                    }));
                    
                    // Fetch the exam details to get the question count
                    try {
                      const examResponse = await clientAPI.get(`/exam/${examId}`);
                      if (examResponse.data && examResponse.data.data) {
                        const examData = examResponse.data.data;
                        const questionCount = examData.questions?.length || 0;
                        setSelectedExamQuestionCount(questionCount);
                        
                        // Set default question count to all questions and default schedule name
                        setExamSettingForm(prev => ({
                          ...prev,
                          question_count: questionCount,
                          schedule_name: examData.title || '' // Default schedule name to exam title
                        }));
                      }
                    } catch (err) {
                      console.error('Error fetching exam details:', err);
                      errorHandler(err);
                    }
                  }}
                  className="mb-4"
                >
                  {examinations.map((exam) => (
                    <SelectItem key={exam._id} value={exam._id}>
                      {exam.title}
                    </SelectItem>
                  ))}
                </Select>
                
                <Input
                  label="Schedule Name"
                  placeholder="Enter a name for this examination schedule"
                  value={examSettingForm.schedule_name}
                  onValueChange={(schedule_name) => 
                    setExamSettingForm(prev => ({ ...prev, schedule_name }))}
                  className="mb-4"
                  isRequired
                  description="This name will be displayed to students"
                />
                
                <Divider className="my-2" />
                <p className="text-sm font-medium">Examination Period</p>
                
                <div className="flex flex-col gap-2 mb-4">
                  <Input
                    type="datetime-local"
                    label="Open Time"
                    placeholder="Select open time"
                    isRequired
                    value={formatDateForInput(examSettingForm.open_time)}
                    onChange={(e) => {
                      const date = new Date(e.target.value);
                      if (!isNaN(date.getTime())) {
                        setExamSettingForm(prev => ({ ...prev, open_time: date }));
                      }
                    }}
                  />
                  
                  <Input
                    type="datetime-local"
                    label="Close Time"
                    placeholder="Select close time"
                    isRequired
                    value={formatDateForInput(examSettingForm.close_time)}
                    onChange={(e) => {
                      const date = new Date(e.target.value);
                      if (!isNaN(date.getTime())) {
                        setExamSettingForm(prev => ({ ...prev, close_time: date }));
                      }
                    }}
                  />
                </div>
                
                <Divider className="my-2" />
                <p className="text-sm font-medium">Security Settings</p>
                
                <div className="flex flex-col gap-2 mb-4">
                  <Input 
                    label="IP Range (optional)"
                    placeholder="e.g., 192.168.1.0/24"
                    value={examSettingForm.ip_range}
                    onValueChange={(ip_range) => 
                      setExamSettingForm(prev => ({ ...prev, ip_range }))}
                  />
                  
                  <Input 
                    label="Exam Code (optional)"
                    placeholder="Enter exam access code"
                    value={examSettingForm.exam_code}
                    onValueChange={(exam_code) => 
                      setExamSettingForm(prev => ({ ...prev, exam_code }))}
                  />
                  
                  <Input 
                    type="number"
                    label="Allowed Attempts"
                    placeholder="Number of attempts allowed"
                    min={1}
                    value={examSettingForm.allowed_attempts.toString()}
                    onValueChange={(value) => 
                      setExamSettingForm(prev => ({ 
                        ...prev, 
                        allowed_attempts: parseInt(value) || 1 
                      }))}
                    isRequired
                  />
                </div>
                
                <Divider className="my-2" />
                <p className="text-sm font-medium">Question Selection</p>
                
                <div className="flex flex-col gap-2 mb-4">
                  <Input
                    type="number"
                    label="Number of Questions"
                    placeholder="Number of questions to include"
                    description={`The exam has ${selectedExamQuestionCount} questions in total. Leave at ${selectedExamQuestionCount} to include all questions.`}
                    min={1}
                    max={selectedExamQuestionCount}
                    value={examSettingForm.question_count.toString()}
                    onValueChange={(value) => {
                      const count = parseInt(value) || 0;
                      // Ensure count is between 1 and the total number of questions
                      const validCount = Math.min(
                        Math.max(count, 1), 
                        selectedExamQuestionCount || 1
                      );
                      setExamSettingForm(prev => ({ 
                        ...prev, 
                        question_count: validCount 
                      }));
                    }}
                    isDisabled={selectedExamQuestionCount === 0}
                  />
                </div>
                
                <Divider className="my-2" />
                <p className="text-sm font-medium">Examination Options</p>
                
                <div className="flex flex-col gap-2">
                  <Switch
                    color='secondary'
                    isSelected={examSettingForm.allowed_review}
                    onValueChange={(allowed_review) => 
                      setExamSettingForm(prev => ({ ...prev, allowed_review }))}
                  >
                    Allow students to review their answers
                  </Switch>
                  
                  <Switch
                    color='secondary'
                    isSelected={examSettingForm.show_answer}
                    onValueChange={(show_answer) => 
                      setExamSettingForm(prev => ({ ...prev, show_answer }))}
                  >
                    Show correct answers after submission
                  </Switch>
                  
                  <Switch
                    color='secondary'
                    isSelected={examSettingForm.randomize_question}
                    onValueChange={(randomize_question) => 
                      setExamSettingForm(prev => ({ ...prev, randomize_question }))}
                  >
                    Randomize question order
                  </Switch>
                  
                  <Switch
                    color='secondary'
                    isSelected={examSettingForm.randomize_choice}
                    onValueChange={(randomize_choice) => 
                      setExamSettingForm(prev => ({ ...prev, randomize_choice }))}
                  >
                    Randomize answer choices
                  </Switch>
                </div>
              </CardBody>
            </Card>
          </ModalBody>
          <ModalFooter>
            <Button color="danger" variant="light" onPress={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              color="success" 
              isLoading={submitting}
              isDisabled={submitting}
            >
              Create Schedule
            </Button>
          </ModalFooter>
        </form>
      )}
    </ModalContent>
  )
}

export default ExamScheduleModal
