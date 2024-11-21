"use client"

import NewQuestionForm from "@/components/exam/new-question-form"
import DraggableQuestion from "@/components/exam/question/draggable-question"
import NestedQuestionForm from "@/components/exam/question/nested-question"
import { IconParkOutlineCheckCorrect, IconParkTwotoneNestedArrows, MdiBin, MingcuteAddFill, MingcuteFileNewFill, SystemUiconsReuse } from "@/components/icons/icons"
import { clientAPI } from "@/config/axios.config"
import { errorHandler } from "@/utils/error"
import { Button, Card, CardBody, CardFooter, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger, Input, Textarea, useDisclosure } from "@nextui-org/react"
import { useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
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
    arrayMove,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { useQuestionListStore } from "@/stores/question.store/question-list.store"
import { useNestedQuestionsStore } from "@/stores/question.store/nested-question.store"

export default function CreateExaminationPage() {
    const params = useSearchParams()
    const _id = params.get('id')
    const [exam, setExam] = useState<ExamResponse | null>(null)
    const [isNewQuestion, setIsNewQuestion] = useState<boolean>(false)
    const [isNestedQuestion, setIsNestedQuestion] = useState<boolean>(false)
    const { questionList, setQuestionList, initializeQuestionList } = useQuestionListStore()
    const { nestedQuestions, setNestedQuestions } = useNestedQuestionsStore()
    const [activeId, setActiveId] = useState<number | null>(null)

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    useEffect(() => {
        const getExam = async () => {
            try {
                const res = await clientAPI.get(`exam/${_id}`)
                setExam(res.data.data)
                initializeQuestionList(res.data.data.questions)
                console.log(res.data)
            } catch (error) {
                console.log(error)
                errorHandler(error)
            }
        }
        getExam()
    }, [])

    function handleDragStart(event: DragStartEvent) {
        const { active } = event
        const { id } = active

        setActiveId(id as number)
    }

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event

        if (!over) return

        const activeId = active.id
        const overId = over.id

        if (activeId === overId) return

        if (String(overId).startsWith("nested-")) {
            setQuestionList((prev) => prev.filter((item) => item.id !== activeId))
            const draggedItem = questionList.find((item) => item.id === activeId)
            if (draggedItem) {
                setNestedQuestions((prev) => [...prev, draggedItem])
            }
        } else {
            setQuestionList((items) => {
                const oldIndex = items.findIndex((item) => item.id === activeId)
                const newIndex = items.findIndex((item) => item.id === overId)
                return arrayMove(items, oldIndex, newIndex)
            })
        }
    }

    if (exam) {
        return (
            <DndContext
                onDragEnd={handleDragEnd}
                onDragStart={handleDragStart}
                sensors={sensors}
                collisionDetection={closestCenter}
                modifiers={[]}
            >
                <div className="grid grid-cols-3">
                    <div className="col-span-1 flex flex-col gap-y-8">
                        <div className="flex flex-row-reverse gap-x-6">
                            <div className="flex flex-col gap-y-3">
                                <Dropdown>
                                    <DropdownTrigger>
                                        <Button
                                            startContent={<MingcuteAddFill fontSize={14} />}
                                            variant="flat"
                                            className="text-primary"
                                            color="primary"
                                            size="sm"
                                        > Add Question </Button>
                                    </DropdownTrigger>
                                    <DropdownMenu aria-label="Static Actions" variant="faded">
                                        <DropdownItem
                                            startContent={<MingcuteFileNewFill />}
                                            key="add-question"
                                            onPress={() => {
                                                setIsNewQuestion(true)
                                                setIsNestedQuestion(false)
                                            }}
                                            isDisabled={isNewQuestion}
                                            className={`${isNewQuestion ? 'cursor-not-allowed' : ''}`}
                                        >
                                            New Question
                                        </DropdownItem>
                                        <DropdownItem
                                            onPress={() => {
                                                setIsNewQuestion(false)
                                                setIsNestedQuestion(true)
                                            }}
                                            startContent={<IconParkTwotoneNestedArrows />}
                                            description='' key="nested-question"
                                            isDisabled={isNestedQuestion}
                                        >
                                            <h1>Add Nested Question</h1>
                                            <span className="text-tiny text-foreground/50">add your nested question.</span>
                                        </DropdownItem>
                                        <DropdownItem startContent={<SystemUiconsReuse />} description='' key="reuse-question">
                                            <h1>Reuse Question</h1>
                                            <span className="text-tiny text-foreground/50">use your questions from question bank.</span>
                                        </DropdownItem>

                                    </DropdownMenu>
                                </Dropdown>
                                <Button
                                    startContent={<MdiBin fontSize={14} />}
                                    variant="flat"
                                    color='danger'
                                    size="sm"
                                > Delete </Button>
                                <Button
                                    startContent={<IconParkOutlineCheckCorrect fontSize={14} />}
                                    variant="flat"
                                    className="text-blue-300 bg-blue-500/30"
                                    size="sm"
                                > Finish </Button>
                            </div>
                            <form className="w-full">
                                <Card>
                                    <CardBody className="gap-y-3">
                                        <Input size='sm' label='Examination Name' defaultValue={exam.title} isDisabled />
                                        <Textarea label="Description" description='Limit 1,000 characters.' defaultValue={exam.description} isDisabled />
                                    </CardBody>
                                    <CardFooter className="pt-0 flex justify-between">
                                        <Button size="sm" color="success" isDisabled>Save</Button>
                                        <Button size="sm" color="warning" >Edit</Button>
                                    </CardFooter>
                                </Card>
                            </form>
                        </div>
                        {questionList.length == 0 ?
                            <div className="flex flex-col gap-y-3">
                                <p className="text-center text-sm text-foreground/50">No question added yet.</p>
                            </div>
                            :

                            <div className="flex flex-col gap-y-3">

                                <SortableContext items={questionList} strategy={verticalListSortingStrategy}>
                                    {
                                        questionList.map((question, index) => (
                                            <DraggableQuestion question={question} key={index} id={question.id} />
                                        ))
                                    }
                                </SortableContext>
                                <DragOverlay>{activeId ? <DraggableQuestion question={questionList.find((item) => item.id === activeId)!} id={activeId} /> : null}</DragOverlay>
                            </div>}
                    </div>
                    {isNewQuestion ?
                        <NewQuestionForm examination_id={_id!} />
                        : null
                    }
                    {isNestedQuestion ?
                        <NestedQuestionForm />
                        : null
                    }
                </div>
            </DndContext>
        )
    } else {
        return (
            <div>No content</div>
        )
    }
}