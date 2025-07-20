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
  ScrollShadow,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter
} from "@nextui-org/react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import {
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
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
  SolarRefreshLineDuotone,
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
  type: 'mc' | 'tf' | 'sa' | 'nested'
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

// Sortable Question Item Component
interface SortableQuestionItemProps {
  question: SelectedQuestion
  index: number
  onRemove: (questionId: string, examId: string) => void
  getQuestionTypeIcon: (type: string) => JSX.Element
  getQuestionTypeLabel: (type: string) => string
}

function SortableQuestionItem({
  question,
  index,
  onRemove,
  getQuestionTypeIcon,
  getQuestionTypeLabel
}: SortableQuestionItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `${question.examId}-${question._id}` })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`border border-default-200 ${isDragging ? 'shadow-lg' : ''}`}
    >
      <CardBody className="p-3">
        <div className="flex items-start gap-2">
          {/* Drag Handle */}
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-default-100 transition-colors"
          >
            <div className="w-2 h-4 flex flex-col justify-center gap-0.5">
              <div className="w-full h-0.5 bg-default-400 rounded"></div>
              <div className="w-full h-0.5 bg-default-400 rounded"></div>
              <div className="w-full h-0.5 bg-default-400 rounded"></div>
            </div>
          </div>

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
            onPress={() => onRemove(question._id, question.examId)}
          >
            <MdiBin className="w-4 h-4" />
          </Button>
        </div>
      </CardBody>
    </Card>
  )
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
  const [selectedGroups, setSelectedGroups] = useState<string[]>([])
  const [submitting, setSubmitting] = useState<boolean>(false)
  const [selectedExamQuestionCount, setSelectedExamQuestionCount] = useState<number>(0)
  const [selectedQuestions, setSelectedQuestions] = useState<SelectedQuestion[]>([])
  const [currentStep, setCurrentStep] = useState<'exam' | 'questions' | 'schedule'>('exam')
  const [examQuestions, setExamQuestions] = useState<{ [examId: string]: Question[] }>({})
  const [selectionMode, setSelectionMode] = useState<'manual' | 'random' | 'hybrid' | null>(null)
  const [selectionHistory, setSelectionHistory] = useState<Array<{ mode: 'manual' | 'random', count?: number, timestamp: number }>>([])

  // Per-examination selection methods
  const [examSelectionMethods, setExamSelectionMethods] = useState<{ [examId: string]: 'manual' | 'random' }>({})
  const [examRandomCounts, setExamRandomCounts] = useState<{ [examId: string]: number }>({})

  // Modal state
  const [isExamModalOpen, setIsExamModalOpen] = useState<boolean>(false)
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState<boolean>(false)
  const [selectedExams, setSelectedExams] = useState<string[]>([])

  // Optional features state
  const [enableScheduling, setEnableScheduling] = useState<boolean>(false)
  const [enableExamCode, setEnableExamCode] = useState<boolean>(false)

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Handle drag end for question reordering
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      setSelectedQuestions((items) => {
        const oldIndex = items.findIndex((item) => `${item.examId}-${item._id}` === active.id)
        const newIndex = items.findIndex((item) => `${item.examId}-${item._id}` === over.id)

        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }

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
      case 'mc':
        return <HealthiconsIExamMultipleChoice className="w-4 h-4" />
      case 'tf':
        return <PajamasFalsePositive className="w-4 h-4" />
      case 'sa':
        return <CarbonTextLongParagraph className="w-4 h-4" />
      case 'nested':
        return <IconParkTwotoneNestedArrows className="w-4 h-4" />
      default:
        return <HealthiconsIExamMultipleChoice className="w-4 h-4" />
    }
  }

  const getQuestionTypeLabel = (type: string) => {
    switch (type) {
      case 'mc':
        return 'Multiple Choice'
      case 'tf':
        return 'True/False'
      case 'sa':
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

  // Track manual question selection/deselection
  const handleManualQuestionToggle = (question: Question, examId: string, examTitle: string, isSelected: boolean) => {
    if (isSelected) {
      // Remove question
      setSelectedQuestions(prev =>
        prev.filter(q => !(q._id === question._id && q.examId === examId))
      );
    } else {
      // Add question
      const selectedQuestion: SelectedQuestion = {
        ...question,
        examId,
        examTitle
      };
      setSelectedQuestions(prev => [...prev, selectedQuestion]);

      // Update selection mode based on current exam selection methods
      const updatedExamMethods = { ...examSelectionMethods, [examId]: 'manual' as const };
      const hasManualSelections = Object.values(updatedExamMethods).some(method => method === 'manual');
      const hasRandomSelections = Object.values(updatedExamMethods).some(method => method === 'random');

      if (hasManualSelections && hasRandomSelections) {
        setSelectionMode('hybrid');
      } else if (Object.values(updatedExamMethods).every(method => method === 'manual')) {
        setSelectionMode('manual');
      } else {
        setSelectionMode('random');
      }

      // Add to selection history
      setSelectionHistory(prev => [...prev, {
        mode: 'manual',
        timestamp: Date.now()
      }]);
    }
  }

  // Fetch questions for selected exams
  const fetchExamQuestions = async (examIds: string[]) => {
    try {
      const questionsData: { [examId: string]: Question[] } = {}

      for (const examId of examIds) {
        if (!examQuestions[examId]) {
          const response = await clientAPI.get(`/exam/${examId}`)
          if (response.data?.data?.questions) {
            questionsData[examId] = response.data.data.questions
          }
        } else {
          questionsData[examId] = examQuestions[examId]
        }
      }

      setExamQuestions(prev => ({ ...prev, ...questionsData }))
      return questionsData
    } catch (error) {
      console.error('Error fetching exam questions:', error)
      toast.error('Failed to fetch exam questions')
      return {}
    }
  }

  const [examSettingForm, setExamSettingForm] = useState({
    exam_ids: [] as string[],  // Multiple exam IDs
    schedule_name: '',  // Custom name for the schedule
    open_time: new Date(),
    close_time: new Date(Date.now() + 1 * 60 * 60 * 1000), // Default to 1 hour later
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
            console.log('Fetched groups:', groups)
            setGroups(groups)
            if (groups.length > 0) {
              // If groupId is provided in URL, use that, otherwise select all groups
              if (groupId) {
                const foundGroup = groups.find((g: any) => g._id === groupId)
                if (foundGroup) {
                  console.log('Found specific group:', foundGroup)
                  setSelectedGroups([foundGroup.group_name])
                } else {
                  console.log('Group not found, selecting all groups')
                  setSelectedGroups(groups.map((g: any) => g.group_name))
                }
              } else {
                console.log('No specific groupId, selecting all groups')
                const allGroupNames = groups.map((g: any) => g.group_name)
                console.log('Selected group names:', allGroupNames)
                setSelectedGroups(allGroupNames)
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

  const handleExamSelectionChange = async (updatedExamIds: string[], isAdditive: boolean = false) => {
    setExamSettingForm({
      ...examSettingForm,
      exam_ids: updatedExamIds
    });
    setSelectedExams(updatedExamIds);

    // Only clear previous selections if not in additive mode
    if (!isAdditive) {
      setSelectedQuestions([]);
      // Initialize selection methods for new exams (default to manual)
      const newMethods: { [examId: string]: 'manual' | 'random' } = {};
      const newCounts: { [examId: string]: number } = {};
      updatedExamIds.forEach(examId => {
        newMethods[examId] = 'manual';
        newCounts[examId] = 5; // default random count
      });
      setExamSelectionMethods(newMethods);
      setExamRandomCounts(newCounts);
    }

    if (updatedExamIds.length > 0) {
      // Close exam modal
      setIsExamModalOpen(false);

      // Fetch questions for newly selected exams
      const newExamIds = isAdditive
        ? updatedExamIds.filter(id => !Object.keys(examQuestions).includes(id))
        : updatedExamIds;

      if (newExamIds.length > 0) {
        await fetchExamQuestions(newExamIds);
      }

      // Initialize selection methods for new exams in additive mode
      if (isAdditive) {
        const newMethods = { ...examSelectionMethods };
        const newCounts = { ...examRandomCounts };
        newExamIds.forEach(examId => {
          if (!newMethods[examId]) {
            newMethods[examId] = 'manual';
            newCounts[examId] = 5;
          }
        });
        setExamSelectionMethods(newMethods);
        setExamRandomCounts(newCounts);
      }

      // Go directly to question selection
      setCurrentStep('questions');
      setIsQuestionModalOpen(true);

      // Update question count based on total questions from all selected exams
      let totalQuestions = 0;
      updatedExamIds.forEach(examId => {
        const exam = examinations.find(e => e._id === examId);
        totalQuestions += exam?.questions?.length || 0;
      });

      setExamSettingForm(prev => ({
        ...prev,
        exam_ids: updatedExamIds,
        question_count: totalQuestions
      }));
      setSelectedExamQuestionCount(totalQuestions);
    } else {
      setExamSettingForm(prev => ({
        ...prev,
        exam_ids: updatedExamIds,
        question_count: 0
      }));
      setSelectedExamQuestionCount(0);
      setCurrentStep('exam');
    }
  }

  // Handle adding more exams to existing selection
  const handleAddMoreExams = () => {
    setIsQuestionModalOpen(false);
    setIsExamModalOpen(true);
    // Don't change currentStep, keep it as 'questions' to maintain context
  }



  // Generate random questions for a specific exam
  const handleRandomSelectionForExam = (examId: string, count: number) => {
    const exam = examinations.find(e => e._id === examId);
    const questions = examQuestions[examId] || [];

    if (!exam || questions.length === 0) return;

    // Remove existing selections for this exam
    setSelectedQuestions(prev => prev.filter(q => q.examId !== examId));

    // Shuffle and select random questions
    const shuffled = questions.sort(() => Math.random() - 0.5);
    const randomSelected = shuffled.slice(0, Math.min(count, questions.length));

    // Convert to SelectedQuestion format
    const newSelectedQuestions: SelectedQuestion[] = randomSelected.map(question => ({
      ...question,
      examId,
      examTitle: exam.title
    }));

    // Add to existing selections
    setSelectedQuestions(prev => [...prev, ...newSelectedQuestions]);

    // Update selection mode based on current exam selection methods
    // Include the current exam being set to random in the calculation
    const updatedExamMethods = { ...examSelectionMethods, [examId]: 'random' as const };
    const hasManualSelections = Object.values(updatedExamMethods).some(method => method === 'manual');
    const hasRandomSelections = Object.values(updatedExamMethods).some(method => method === 'random');

    if (hasManualSelections && hasRandomSelections) {
      setSelectionMode('hybrid');
    } else if (Object.values(updatedExamMethods).every(method => method === 'random')) {
      setSelectionMode('random');
    } else {
      setSelectionMode('manual');
    }

    // Add to selection history
    setSelectionHistory(prev => [...prev, {
      mode: 'random',
      count: newSelectedQuestions.length,
      timestamp: Date.now()
    }]);
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

    // Validate selected questions
    if (selectedQuestions.length === 0) {
      setError('Please select at least one question from your examinations')
      setSubmitting(false)
      return
    }

    // Validate selected groups
    if (selectedGroups.length === 0) {
      setError('Please select at least one group to assign the schedule to')
      setSubmitting(false)
      return
    }

    // Validate scheduling fields if enabled
    if (enableScheduling) {
      if (!examSettingForm.open_time) {
        setError('Please provide an open time for the scheduled exam')
        setSubmitting(false)
        return
      }
      if (!examSettingForm.close_time) {
        setError('Please provide a close time for the scheduled exam')
        setSubmitting(false)
        return
      }
      if (examSettingForm.open_time >= examSettingForm.close_time) {
        setError('Close time must be after open time')
        setSubmitting(false)
        return
      }
    }

    // Validate exam code if enabled
    if (enableExamCode && !examSettingForm.exam_code.trim()) {
      setError('Please provide an exam access code')
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

      // Prepare enhanced data for backend compatibility
      const enhancedData = {
        // Core exam setting data
        schedule_name: formattedForm.schedule_name,
        // Only include scheduling fields if enabled
        ...(enableScheduling && {
          open_time: formattedForm.open_time,
          close_time: formattedForm.close_time,
        }),
        ip_range: formattedForm.ip_range || '',
        // Only include exam code if enabled
        ...(enableExamCode && formattedForm.exam_code && {
          exam_code: formattedForm.exam_code,
        }),
        allowed_attempts: formattedForm.allowed_attempts,
        allowed_review: formattedForm.allowed_review,
        show_answer: formattedForm.show_answer,
        randomize_question: formattedForm.randomize_question,
        randomize_choice: formattedForm.randomize_choice,
        question_count: selectedQuestions.length,

        // Enhanced data for multi-exam and question selection support
        exam_ids: formattedForm.exam_ids, // All selected exam IDs
        selected_questions: selectedQuestions.map(q => ({
          question_id: q._id,
          exam_id: q.examId,
          exam_title: q.examTitle,
          question_type: q.type,
          score: q.score,
          question_text: q.question // Include question text for reference
        })),
        total_score: selectedQuestions.reduce((total, q) => total + q.score, 0),

        // Exam sources breakdown for analytics and reporting
        exam_sources: selectedExams.map(examId => {
          const exam = examinations.find(e => e._id === examId);
          const questionsFromExam = selectedQuestions.filter(q => q.examId === examId);
          return {
            exam_id: examId,
            exam_title: exam?.title || 'Unknown',
            question_count: questionsFromExam.length,
            total_score: questionsFromExam.reduce((total, q) => total + q.score, 0)
          };
        }),

        // Selection metadata for future reference
        selection_metadata: {
          selection_mode: selectionMode,
          selection_history: selectionHistory,
          exam_selection_methods: examSelectionMethods,
          exam_random_counts: examRandomCounts,
          created_at: new Date().toISOString(),
          total_exams_selected: selectedExams.length,
          // Optional features status
          features_enabled: {
            scheduling: enableScheduling,
            exam_code: enableExamCode
          }
        }
      }

      console.log('Submitting exam schedule with enhanced data:', {
        selection_mode: selectionMode,
        total_questions: selectedQuestions.length,
        total_exams: selectedExams.length,
        total_score: enhancedData.total_score,
        scheduling_enabled: enableScheduling,
        exam_code_enabled: enableExamCode,
        has_open_time: !!enhancedData.open_time,
        has_close_time: !!enhancedData.close_time,
        has_exam_code: !!enhancedData.exam_code,
        selected_groups: selectedGroups,
        selected_groups_count: selectedGroups.length
      });

      // Create schedules for all selected groups sequentially to avoid race conditions
      console.log('Creating schedules for groups:', selectedGroups)
      const results = []
      
      for (let index = 0; index < selectedGroups.length; index++) {
        const groupName = selectedGroups[index]
        
        const scheduleData = {
          ...enhancedData,
          schedule_name: selectedGroups.length > 1
            ? `${enhancedData.schedule_name} - ${groupName}`
            : enhancedData.schedule_name
        };

        console.log(`Creating schedule ${index + 1}/${selectedGroups.length} for group: ${groupName}`);
        console.log('Schedule data:', {
          schedule_name: scheduleData.schedule_name,
          selected_questions_count: scheduleData.selected_questions?.length || 0,
          exam_ids: scheduleData.exam_ids
        });

        try {
          const result = await clientAPI.post(
            `/course/${courseId}/group/${encodeURIComponent(groupName)}/exam-setting`,
            scheduleData
          );
          console.log(`✅ Successfully created schedule for group ${groupName}:`, result.data);
          results.push(result);
        } catch (error) {
          console.error(`❌ Failed to create schedule for group ${groupName}:`, error);
          throw error;
        }
      }

      // Log successful creation for debugging
      console.log('Successfully created exam schedules:', results.length);

      if (selectedGroups.length === 1) {
        toast.success('Examination schedule created successfully')
      } else {
        toast.success(`Examination schedules created successfully for ${selectedGroups.length} groups`)
      }

      setTrigger(!trigger)

      // Navigate back to the schedules page
      router.push('/overview/create/schedule')
    } catch (err: any) {
      console.error('Error creating examination schedule:', err)

      // Enhanced error logging
      if (err.response?.data) {
        console.error('Backend error details:', err.response.data);
      }

      if (err.response && err.response.data && err.response.data.message) {
        setError(`Failed to create schedule: ${err.response.data.message}`)
      } else {
        setError('Failed to create examination schedule. Please check your selections and try again.')
        errorHandler(err)
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-0 max-w-7xl">
      {/* Header with breadcrumbs */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
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
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">
                        Select Exams
                        <span className="text-danger ml-1">*</span>
                      </label>
                      <Button
                        color="secondary"
                        variant="bordered"
                        className="w-full h-14 justify-start px-3"
                        startContent={<HealthiconsIExamMultipleChoice className="text-xl" />}
                        endContent={examSettingForm.exam_ids.length > 0 && <div className="bg-secondary text-white rounded-full px-2 py-1 text-xs">{examSettingForm.exam_ids.length}</div>}
                        onPress={() => setIsExamModalOpen(true)}
                        isDisabled={submitting || examinations.length === 0 || selectionMode === 'random' || selectionMode === 'hybrid'}
                      >
                        <div className="flex flex-col items-start">
                          <span className="text-sm text-default-500">
                            {selectedQuestions.length > 0 ? 'Add More Examinations' : 'Select Examination'}
                          </span>
                          <span>{getSelectedExamsTitle()}</span>
                        </div>
                      </Button>
                    </div>

                    <div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium text-foreground">
                            Select Groups
                            <span className="text-danger ml-1">*</span>
                          </label>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="light"
                              color="primary"
                              onPress={() => {
                                if (selectedGroups.length === groups.length) {
                                  setSelectedGroups([])
                                } else {
                                  setSelectedGroups(groups.map(g => g.group_name))
                                }
                              }}
                              isDisabled={submitting || groups.length === 0}
                            >
                              {selectedGroups.length === groups.length ? 'Deselect All' : 'Select All'}
                            </Button>
                            <Badge color="primary" variant="flat">
                              {selectedGroups.length}/{groups.length}
                            </Badge>
                          </div>
                        </div>

                        <Select
                          placeholder={selectedGroups.length === 0 ? "Select groups" : `${selectedGroups.length} group${selectedGroups.length > 1 ? 's' : ''} selected`}
                          isRequired
                          isDisabled={submitting || groups.length === 0}
                          selectedKeys={selectedGroups}
                          selectionMode="multiple"
                          onSelectionChange={(keys) => {
                            const selectedArray = Array.from(keys) as string[]
                            setSelectedGroups(selectedArray)
                          }}
                          classNames={{
                            trigger: "min-h-12",
                            value: "text-small"
                          }}
                        >
                          {groups.length > 0 ? (
                            groups.map((group) => (
                              <SelectItem key={group.group_name} value={group.group_name}>
                                {group.group_name}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem key="no-groups" value="" isDisabled>
                              No groups available
                            </SelectItem>
                          )}
                        </Select>

                        {selectedGroups.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {selectedGroups.map((groupName) => (
                              <Chip
                                key={groupName}
                                size="sm"
                                variant="flat"
                                color="primary"
                                onClose={() => {
                                  setSelectedGroups(prev => prev.filter(g => g !== groupName))
                                }}
                              >
                                {groupName}
                              </Chip>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Question Selection Summary */}
                  {selectedQuestions.length > 0 && (
                    <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <MaterialSymbolsListAlt className="w-5 h-5 text-primary" />
                          <h3 className="text-lg font-semibold">Selected Questions</h3>
                        </div>

                        <div className="flex gap-2">
                          <>
                            <Button
                              size="sm"
                              color="secondary"
                              variant="bordered"
                              startContent={<MingcuteAddFill className="w-4 h-4" />}
                              onPress={() => setIsQuestionModalOpen(true)}
                              isDisabled={submitting}
                            >
                              Modify Selection
                            </Button>
                          </>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="text-sm text-default-600">
                          Questions from {selectedExams.length} examination{selectedExams.length > 1 ? 's' : ''}:
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {selectedExams.map(examId => {
                            const exam = examinations.find(e => e._id === examId);
                            const questionsFromExam = selectedQuestions.filter(q => q.examId === examId);

                            if (!exam) return null;

                            return (
                              <Chip
                                key={examId}
                                size="sm"
                                variant="flat"
                                color="primary"
                                className="text-xs"
                              >
                                {exam.title} ({questionsFromExam.length} questions)
                              </Chip>
                            );
                          })}
                        </div>

                        <div className="flex gap-4 text-xs text-default-500">
                          <span>Add more questions by clicking "Modify Selection" or "Add More Exams"</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Schedule Settings */}
                  <div className="bg-default-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4">Schedule Information</h3>

                    <div className="space-y-4">
                      {/* Basic Information */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                          type="text"
                          label="Schedule Name"
                          placeholder="Enter a name for this schedule"
                          value={examSettingForm.schedule_name}
                          onChange={(e) => setExamSettingForm({ ...examSettingForm, schedule_name: e.target.value })}
                          isRequired
                          isDisabled={submitting}
                        />
                      </div>

                      {/* Optional Features Toggles */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-default-100 rounded-xl">
                          <div>
                            <h4 className="font-medium text-sm">Schedule Timing</h4>
                            <p className="text-xs text-default-500">Set specific open and close times for the exam</p>
                          </div>
                          <Switch
                            color="secondary"
                            isSelected={enableScheduling}
                            onValueChange={setEnableScheduling}
                            isDisabled={submitting}
                          />
                        </div>

                        <div className="flex items-center justify-between p-3 bg-default-100 rounded-xl">
                          <div>
                            <h4 className="font-medium text-sm">Exam Access Code</h4>
                            <p className="text-xs text-default-500">Require a code for students to access the exam</p>
                          </div>
                          <Switch
                            color="secondary"
                            isSelected={enableExamCode}
                            onValueChange={setEnableExamCode}
                            isDisabled={submitting}
                          />
                        </div>
                      </div>

                      {/* Conditional Scheduling Inputs */}
                      {enableScheduling && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Input
                            type="datetime-local"
                            label="Open Time"
                            description="When students can start taking the exam"
                            value={formatDateForInput(examSettingForm.open_time)}
                            onChange={(e) => setExamSettingForm({ ...examSettingForm, open_time: new Date(e.target.value) })}
                            isRequired={enableScheduling}
                            isDisabled={submitting}
                          />

                          <Input
                            type="datetime-local"
                            label="Close Time"
                            description={
                              examSettingForm.open_time && examSettingForm.close_time && 
                              examSettingForm.close_time.getTime() > examSettingForm.open_time.getTime()
                                ? `Time remaining: ${Math.round((examSettingForm.close_time.getTime() - examSettingForm.open_time.getTime()) / (1000 * 60))} minutes`
                                : "When the exam becomes unavailable"
                            }
                            value={formatDateForInput(examSettingForm.close_time)}
                            onChange={(e) => setExamSettingForm({ ...examSettingForm, close_time: new Date(e.target.value) })}
                            isRequired={enableScheduling}
                            isDisabled={submitting}
                          />
                        </div>
                      )}

                      {!enableScheduling && (
                        <div className="p-3 bg-success-50 border border-success-200 rounded-lg">
                          <p className="text-sm text-success-700">
                            📅 <strong>Immediate Access:</strong> Students can access this exam immediately after creation with no time restrictions.
                          </p>
                        </div>
                      )}

                      {/* Conditional Exam Code Input */}
                      {enableExamCode && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="relative">
                            <Input
                              type="text"
                              label="Exam Access Code"
                              placeholder="Enter exam access code"
                              description=""
                              value={examSettingForm.exam_code}
                              onChange={(e) => setExamSettingForm({ ...examSettingForm, exam_code: e.target.value })}
                              isRequired={enableExamCode}
                              isDisabled={submitting}
                              endContent={
                                <Button 
                                  isIconOnly 
                                  variant="light" 
                                  className="text-default-400 mr-1" 
                                  onPress={() => {
                                    // Generate a random 6-character alphanumeric code
                                    const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
                                    let result = '';
                                    for (let i = 0; i < 6; i++) {
                                      result += characters.charAt(Math.floor(Math.random() * characters.length));
                                    }
                                    setExamSettingForm({ ...examSettingForm, exam_code: result });
                                  }}
                                  isDisabled={submitting}
                                >
                                  <SolarRefreshLineDuotone width={18} height={18} />
                                </Button>
                              }
                            />
                            <div className="text-xs text-default-400 mt-1 ml-1">
                              Click the refresh button to auto-generate a code
                            </div>
                          </div>
                        </div>
                      )}

                      {!enableExamCode && (
                        <div className="p-3 bg-success-50 border border-success-200 rounded-lg">
                          <p className="text-sm text-success-700">
                            🔓 <strong>Open Access:</strong> Students can access this exam without needing an access code.
                          </p>
                        </div>
                      )}


                    </div>
                  </div>

                  {/* Exam Options */}
                  <div className="bg-default-50 p-4 pt-0 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4">Exam Options</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <Input
                        type="text"
                        label="IP Range (Optional)"
                        placeholder="e.g., 192.168.1.0/24"
                        value={examSettingForm.ip_range}
                        onChange={(e) => setExamSettingForm({ ...examSettingForm, ip_range: e.target.value })}
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

                    <div className="flex flex-col gap-4">
                      <Switch
                        color="secondary"
                        isSelected={examSettingForm.allowed_review}
                        onValueChange={(value) => setExamSettingForm({ ...examSettingForm, allowed_review: value })}
                        isDisabled={submitting}
                      >
                        Allow students to review their answers after submission
                      </Switch>

                      <Switch
                        color="secondary"
                        isSelected={examSettingForm.show_answer}
                        onValueChange={(value) => setExamSettingForm({ ...examSettingForm, show_answer: value })}
                        isDisabled={submitting}
                      >
                        Show correct answers after submission
                      </Switch>

                      <Switch
                        color="secondary"
                        isSelected={examSettingForm.randomize_question}
                        onValueChange={(value) => setExamSettingForm({ ...examSettingForm, randomize_question: value })}
                        isDisabled={submitting}
                      >
                        Randomize question order
                      </Switch>

                      <Switch
                        color="secondary"
                        isSelected={examSettingForm.randomize_choice}
                        onValueChange={(value) => setExamSettingForm({ ...examSettingForm, randomize_choice: value })}
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
                      isDisabled={submitting || selectedQuestions.length === 0 || selectedGroups.length === 0}
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
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <IconParkOutlineCheckCorrect className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-semibold">Selected Questions</h3>
                  <Badge color="primary" variant="flat">
                    {selectedQuestions.length}
                  </Badge>
                </div>
                {selectedQuestions.length > 1 && (
                  <div className="text-xs text-default-500">
                    Drag to reorder
                  </div>
                )}
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
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={selectedQuestions.map(q => `${q.examId}-${q._id}`)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-3">
                        {selectedQuestions.map((question, index) => (
                          <SortableQuestionItem
                            key={`${question.examId}-${question._id}`}
                            question={question}
                            index={index}
                            onRemove={removeSelectedQuestion}
                            getQuestionTypeIcon={getQuestionTypeIcon}
                            getQuestionTypeLabel={getQuestionTypeLabel}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                </ScrollShadow>
              )}

              {selectedQuestions.length > 0 && (
                <div className="mt-4 p-3 bg-primary/10 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Total Score:</span>
                    <Chip size="sm" color="secondary" variant="flat">
                      {selectedQuestions.reduce((total, q) => total + q.score, 0)} pts
                    </Chip>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-sm font-medium">Questions:</span>
                    <Chip size="sm" color="secondary" variant="flat">
                      {selectedQuestions.length}
                    </Chip>
                  </div>

                  {/* Selection Mode Indicator */}
                  {selectionMode && (
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-sm font-medium">Selection Mode:</span>
                      <Chip
                        size="sm"
                        variant="flat"
                        color={selectionMode === 'manual' ? 'primary' : selectionMode === 'random' ? 'secondary' : 'warning'}
                      >
                        {selectionMode === 'manual' ? 'Manual' : selectionMode === 'random' ? 'Random' : 'Hybrid'}
                      </Chip>
                    </div>
                  )}

                  {/* Selection History */}
                  {selectionHistory.length > 0 && selectionMode === 'hybrid' && (
                    <div className="mt-2">
                      <span className="text-xs text-default-500">Selection History:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectionHistory.map((entry, index) => (
                          <Chip
                            key={index}
                            size="sm"
                            variant="dot"
                            color={entry.mode === 'manual' ? 'primary' : 'secondary'}
                          >
                            {entry.mode === 'manual' ? 'Manual' : `Random (${entry.count})`}
                          </Chip>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              {selectedQuestions.length > 0 && (
                <div className="mt-4 space-y-2">
                  <Button
                    size="sm"
                    variant="bordered"
                    color="secondary"
                    fullWidth
                    onPress={() => {
                      setIsQuestionModalOpen(true);
                      setCurrentStep('questions');
                    }}
                  >
                    Modify Selection
                  </Button>
                  <Button
                    size="sm"
                    variant="bordered"
                    color="danger"
                    fullWidth
                    onPress={() => {
                      setSelectedQuestions([]);
                      setSelectionMode(null);
                      setSelectionHistory([]);
                      setExamSelectionMethods({});
                      setExamRandomCounts({});
                      setCurrentStep('exam');
                    }}
                  >
                    Clear All & Restart
                  </Button>
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
          // Check if we're in additive mode (already have questions selected)
          const isAdditive = currentStep === 'questions' && selectedQuestions.length > 0;
          handleExamSelectionChange(examIds, isAdditive);
        }}
        allowMultiSelect={true}
        instructorId={user?._id || ''}
      />

      {/* Question Selection Modal */}
      <Modal
        isOpen={isQuestionModalOpen}
        onClose={() => {
          setIsQuestionModalOpen(false);
          setCurrentStep('schedule');
        }}
        size="5xl"
        scrollBehavior="inside"
        classNames={{
          base: "max-h-[90vh]",
          body: "p-0",
        }}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1 px-6 py-4">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold">Configure Question Selection</h2>
              <Badge color="secondary" variant="flat">
                {selectedExams.length} exam{selectedExams.length > 1 ? 's' : ''}
              </Badge>
            </div>
            <p className="text-sm text-default-500">
              Choose how to select questions for each examination. You can mix manual and random selection methods.
            </p>
          </ModalHeader>
          <ModalBody className="px-6">
            <div className="space-y-6">
              {selectedExams.map(examId => {
                const exam = examinations.find(e => e._id === examId);
                const questions = examQuestions[examId] || [];
                const selectionMethod = examSelectionMethods[examId] || 'manual';
                const randomCount = examRandomCounts[examId] || 5;
                const selectedFromExam = selectedQuestions.filter(q => q.examId === examId);

                if (!exam) return null;

                return (
                  <div key={examId} className="border border-default-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <HealthiconsIExamMultipleChoice className="w-5 h-5 text-primary" />
                        <h3 className="text-lg font-semibold">{exam.title}</h3>
                        <Badge color="secondary" variant="flat">
                          {questions.length} total questions
                        </Badge>
                        {selectedFromExam.length > 0 && (
                          <Badge color="primary" variant="flat">
                            {selectedFromExam.length} selected
                          </Badge>
                        )}
                      </div>
                    </div>

                    {questions.length === 0 ? (
                      <div className="text-center py-8 text-default-500">
                        <Spinner size="sm" className="mb-2" />
                        <p className="text-sm">Loading questions...</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* Selection Method Toggle */}
                        <div className="flex gap-4">
                          <Card
                            className={`flex-1 border-2 cursor-pointer transition-all ${selectionMethod === 'manual'
                              ? 'border-primary bg-primary/5'
                              : 'border-default-200 hover:border-default-300'
                              }`}
                            isPressable
                            onPress={() => {
                              setExamSelectionMethods(prev => ({ ...prev, [examId]: 'manual' }));
                              // Clear any random selections for this exam
                              setSelectedQuestions(prev => prev.filter(q => q.examId !== examId));

                              // Update overall selection mode
                              const updatedExamMethods = { ...examSelectionMethods, [examId]: 'manual' as const };
                              const hasManualSelections = Object.values(updatedExamMethods).some(method => method === 'manual');
                              const hasRandomSelections = Object.values(updatedExamMethods).some(method => method === 'random');

                              if (hasManualSelections && hasRandomSelections) {
                                setSelectionMode('hybrid');
                              } else if (Object.values(updatedExamMethods).every(method => method === 'manual')) {
                                setSelectionMode('manual');
                              } else {
                                setSelectionMode('random');
                              }
                            }}
                          >
                            <CardBody className="p-3 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <MaterialSymbolsListAlt className="w-4 h-4 text-primary" />
                                <span className="font-medium">Manual Selection</span>
                              </div>
                              <p className="text-xs text-default-500 mt-1">
                                Choose specific questions
                              </p>
                            </CardBody>
                          </Card>

                          <Card
                            className={`flex-1 border-2 cursor-pointer transition-all ${selectionMethod === 'random'
                              ? 'border-secondary bg-secondary/5'
                              : 'border-default-200 hover:border-default-300'
                              }`}
                            isPressable
                            onPress={() => {
                              setExamSelectionMethods(prev => ({ ...prev, [examId]: 'random' }));
                              // Generate random selection immediately
                              handleRandomSelectionForExam(examId, randomCount);
                            }}
                          >
                            <CardBody className="p-3 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <MingcuteAddFill className="w-4 h-4 text-secondary" />
                                <span className="font-medium">Random Selection</span>
                              </div>
                              <p className="text-xs text-default-500 mt-1">
                                Auto-select questions
                              </p>
                            </CardBody>
                          </Card>
                        </div>

                        {/* Random Count Input */}
                        {selectionMethod === 'random' && (
                          <div className="flex items-center gap-3">
                            <Input
                              type="number"
                              label="Number of Questions"
                              placeholder="5"
                              value={randomCount.toString()}
                              onChange={(e) => {
                                const newCount = parseInt(e.target.value) || 1;
                                setExamRandomCounts(prev => ({ ...prev, [examId]: newCount }));
                                // Regenerate random selection with new count
                                handleRandomSelectionForExam(examId, newCount);
                              }}
                              min={1}
                              max={questions.length}
                              size="sm"
                              className="w-48"
                            />
                            <Button
                              size="sm"
                              color="secondary"
                              variant="bordered"
                              onPress={() => handleRandomSelectionForExam(examId, randomCount)}
                            >
                              Regenerate
                            </Button>
                          </div>
                        )}

                        {/* Manual Question Selection */}
                        {selectionMethod === 'manual' && (
                          <div className="max-h-60 overflow-y-auto space-y-2">
                            {questions.map((question, index) => {
                              const isSelected = selectedQuestions.some(
                                sq => sq._id === question._id && sq.examId === examId
                              );

                              return (
                                <Card
                                  key={question._id}
                                  className={`border transition-all w-full cursor-pointer hover:shadow-sm ${isSelected
                                    ? 'border-primary bg-primary/5'
                                    : 'border-default-200 hover:border-default-300'
                                    }`}
                                  isPressable
                                  onPress={() => {
                                    handleManualQuestionToggle(question, examId, exam.title, isSelected);
                                  }}
                                >
                                  <CardBody className="p-3">
                                    <div className="flex items-start gap-3">
                                      <Checkbox
                                        isSelected={isSelected}
                                        onChange={() => handleManualQuestionToggle(question, examId, exam.title, isSelected)} // Handled by card press
                                        className="mt-1"
                                        size="sm"
                                      />

                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                          {getQuestionTypeIcon(question.type)}
                                          <Chip size="sm" variant="flat" color="secondary">
                                            {getQuestionTypeLabel(question.type)}
                                          </Chip>
                                          <Chip size="sm" variant="flat" color="primary">
                                            {question.score} pts
                                          </Chip>
                                        </div>

                                        <p className="text-sm font-medium">
                                          Q{index + 1}: {question.question}
                                        </p>
                                      </div>
                                    </div>
                                  </CardBody>
                                </Card>
                              );
                            })}
                          </div>
                        )}

                        {/* Random Selection Preview */}
                        {selectionMethod === 'random' && selectedFromExam.length > 0 && (
                          <div className="bg-secondary/10 p-3 rounded-lg">
                            <p className="text-sm font-medium mb-2">Random Selection Preview:</p>
                            <div className="space-y-1">
                              {selectedFromExam.slice(0, 3).map((question, index) => (
                                <p key={question._id} className="text-xs text-default-600">
                                  • {question.question.substring(0, 60)}...
                                </p>
                              ))}
                              {selectedFromExam.length > 3 && (
                                <p className="text-xs text-default-500">
                                  ... and {selectedFromExam.length - 3} more questions
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </ModalBody>
          <ModalFooter className="px-6 py-4">
            <div className="flex justify-between items-center w-full">
              <div className="flex items-center gap-4">
                <Badge color="primary" variant="flat">
                  {selectedQuestions.length} questions selected
                </Badge>
                <Badge color="secondary" variant="flat">
                  {selectedQuestions.reduce((total, q) => total + q.score, 0)} total points
                </Badge>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="light"
                  onPress={() => {
                    setIsQuestionModalOpen(false);
                    setIsExamModalOpen(true);
                    setCurrentStep('exam');
                  }}
                >
                  Back to Exams
                </Button>
                <Button
                  color="secondary"
                  variant="bordered"
                  startContent={<MingcuteAddFill className="w-4 h-4" />}
                  onPress={handleAddMoreExams}
                >
                  Add More Exams
                </Button>
                <Button
                  color="secondary"
                  onPress={() => {
                    setIsQuestionModalOpen(false);
                    setCurrentStep('schedule');
                  }}
                  isDisabled={selectedQuestions.length === 0}
                >
                  Continue to Schedule
                </Button>
              </div>
            </div>
          </ModalFooter>
        </ModalContent>
      </Modal>


    </div>
  );
}