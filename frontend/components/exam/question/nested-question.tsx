import { GrommetIconsDropbox, MdiBin } from "@/components/icons/icons"
import { StepProvider } from "@/components/provider"
import TextEditor from "@/components/text-editor"
import { Button, Card, CardBody, CardHeader, Chip, Tooltip, Input } from "@nextui-org/react"
import { Formik } from "formik"
import React from "react"
import {
    DndContext,
    DragEndEvent,
    DragOverlay,
    DragStartEvent,
    KeyboardSensor,
    PointerSensor,
    closestCenter,
    useSensor,
    useSensors,
} from '@dnd-kit/core'
import {
    SortableContext,
    verticalListSortingStrategy,
    sortableKeyboardCoordinates,
} from "@dnd-kit/sortable"
import DroppableQuestion from "./droppable-question"
import { useNestedQuestionsStore } from "@/stores/question.store/nested-question.store"
import { useQuestionListStore } from "@/stores/question.store/question-list.store"
import { clientAPI } from "@/config/axios.config"
import { errorHandler } from "@/utils/error"
import { toast } from "react-toastify"
import { useTrigger } from "@/stores/trigger.store"

// Add these type definitions for your question types
export type QuestionSelector = "tf" | "les" | "mc" | "ses";

export interface QuestionForm {
    id: number;
    question: string;
    type: QuestionSelector;
    score: number;
    choices?: Array<string>;
    isTrue?: boolean;
    expectedAnswer?: string;
    maxWords?: number;
}

interface NestedQuestionFormProps {
    examinationId: string;
}

const NestedQuestionForm = ({ examinationId }: NestedQuestionFormProps) => {
    const { nestedQuestions, setNestedQuestions } = useNestedQuestionsStore()
    const { questionList, setQuestionList } = useQuestionListStore()
    const [activeId, setActiveId] = React.useState<number | null>(null)
    const { trigger, setTrigger } = useTrigger()
    const formikRef = React.useRef<any>(null)

    // Function to calculate total score of nested questions
    const calculateTotalScore = () => {
        return nestedQuestions.reduce((total, question) => total + question.score, 0)
    }

    // Update score whenever nested questions change
    React.useEffect(() => {
        if (formikRef.current) {
            const totalScore = calculateTotalScore()
            formikRef.current.setFieldValue('score', totalScore)
        }
    }, [nestedQuestions])

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event
        setActiveId(active.id as number)
        console.log("Drag started:", active.id)
    }

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event
        console.log("Drag ended:", { activeId: active.id, overId: over?.id })

        setActiveId(null)

        if (!over) return

        const activeId = active.id as number
        const overId = over.id

        if (activeId === overId) return

        // Check for the exact ID of the droppable area
        if (overId === "nested-questions") {
            console.log("Moving question to nested questions")
            // Move question from questionList to nestedQuestions
            const questionToMove = questionList.find(q => q.id === activeId)
            if (questionToMove) {
                setQuestionList(prev => prev.filter(q => q.id !== activeId))
                setNestedQuestions(prev => [...prev, questionToMove])
            }
        }
    }

    // Function to remove a question from nested questions
    const removeFromNested = (questionId: number) => {
        const questionToRemove = nestedQuestions.find(q => q.id === questionId)
        if (questionToRemove) {
            setNestedQuestions(prev => prev.filter(q => q.id !== questionId))
            setQuestionList(prev => [...prev, questionToRemove])
        }
    }

    // Get type color based on question type
    const getTypeColor = (type: QuestionSelector) => {
        switch (type) {
            case "mc": return "primary";
            case "tf": return "success";
            case "ses": return "warning";
            case "les": return "secondary";
            default: return "default";
        }
    }

    // Get type label based on question type
    const getTypeLabel = (type: QuestionSelector) => {
        switch (type) {
            case "mc": return "Multiple Choice";
            case "tf": return "True/False";
            case "ses": return "Short Essay";
            case "les": return "Long Essay";
            default: return type;
        }
    }

    return (
        <Formik
            innerRef={formikRef}
            initialValues={{
                question: "",
                type: "nested",
                score: 0,
                questions: [],
            }}
            onSubmit={async (values, { setFieldValue }) => {
                try {
                    // Get the question IDs from nested questions
                    const questionIds = nestedQuestions.map(q => q._id).filter(id => id) as string[]
                    
                    if (questionIds.length === 0) {
                        toast.error("Please add at least one question to create a nested question")
                        return
                    }

                    // Prepare the nested question data for the new API endpoint
                    const nestedQuestionData = {
                        nestedQuestionData: {
                            question: values.question,
                            score: values.score
                        },
                        questionIds: questionIds
                    }

                    // Call the new API endpoint that automatically removes original questions
                    const res = await clientAPI.post(`exam/nested-question-from-existing/${examinationId}`, nestedQuestionData)
                    toast.success(res.data.message)

                    // Reset the form and nested questions
                    setNestedQuestions(() => [])
                    setTrigger(!trigger)
                } catch (error) {
                    errorHandler(error)
                }
            }}
        >
            {({ handleSubmit, values, setFieldValue }) => (
                <form className="col-span-2 pl-32" onSubmit={handleSubmit}>
                    <Card>
                        <CardHeader>
                            <div className="flex gap-x-4 justify-between w-full">
                                <div className="flex gap-x-4">
                                    <Button size="sm" color="success" type="submit">
                                        Save
                                    </Button>
                                    <Button size="sm" onPress={() => {
                                        handleSubmit();
                                        setNestedQuestions(() => []);
                                    }}>
                                        Save and add new question
                                    </Button>
                                </div>

                                <div className="flex items-center gap-2 p-2 rounded-lg bg-black/70">
                                    <span className='text-sm'>Total Score: </span>
                                    <span className='text-secondary font-medium'>{values.score}</span>
                                </div>
                            </div>
                        </CardHeader>
                        <CardBody className="gap-y-9">
                            <StepProvider number={1} content="Write down your question">
                                <div className="px-10">
                                    <TextEditor
                                        className="min-h-[150px] w-full"
                                        name="question"
                                        type="nested"
                                    />
                                </div>
                            </StepProvider>
                            <StepProvider number={2} content="Add your questions">
                                <div className="px-10">
                                    <DroppableQuestion id="nested-questions">
                                        {nestedQuestions.length === 0 && (
                                            <div className="text-md text-secondary gap-x-3 flex w-full h-full justify-center items-center rounded-lg p-8">
                                                <GrommetIconsDropbox fontSize={24} />
                                                <p>Drag and drop questions here</p>
                                            </div>
                                        )}
                                        <div className="space-y-3">
                                            {nestedQuestions.map((question) => (
                                                <Card key={question.id} className="w-full shadow-sm">
                                                    <CardBody className="p-3">
                                                        <div className="flex justify-between items-start">
                                                            <div className="w-full">
                                                                <div className="mb-2" dangerouslySetInnerHTML={{ __html: question.question }} />
                                                                <div className="flex justify-between items-center mt-2">
                                                                    <div className="flex gap-2">
                                                                        <Chip
                                                                            size="sm"
                                                                            color={getTypeColor(question.type as QuestionSelector)}
                                                                            variant="flat"
                                                                        >
                                                                            {getTypeLabel(question.type as QuestionSelector)}
                                                                        </Chip>
                                                                        <Chip
                                                                            size="sm"
                                                                            color="default"
                                                                            variant="flat"
                                                                        >
                                                                            Score: {question.score}
                                                                        </Chip>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <Tooltip content="Remove question">
                                                                <Button
                                                                    isIconOnly
                                                                    size="sm"
                                                                    variant="light"
                                                                    color="danger"
                                                                    className="ml-2"
                                                                    onPress={() => removeFromNested(question.id)}
                                                                >
                                                                    <MdiBin fontSize={16} />
                                                                </Button>
                                                            </Tooltip>
                                                        </div>
                                                    </CardBody>
                                                </Card>
                                            ))}
                                        </div>
                                    </DroppableQuestion>
                                </div>
                            </StepProvider>
                        </CardBody>
                    </Card>
                </form>
            )}
        </Formik>
    )
}

export default NestedQuestionForm
