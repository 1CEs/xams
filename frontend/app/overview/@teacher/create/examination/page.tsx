"use client"

import NewQuestionForm from "@/components/exam/new-question-form"
import DraggableQuestion from "@/components/exam/question/draggable-question"
import NestedQuestionForm from "@/components/exam/question/nested-question"
import { IconParkOutlineCheckCorrect, IconParkTwotoneNestedArrows, IcRoundFolder, MdiBin, MingcuteAddFill, MingcuteFileNewFill, SystemUiconsReuse } from "@/components/icons/icons"
import { clientAPI } from "@/config/axios.config"
import { errorHandler } from "@/utils/error"
import { Button, Card, CardBody, CardFooter, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger, Input, Textarea, Tooltip, useDisclosure } from "@nextui-org/react"
import { useSearchParams } from "next/navigation"
import { ChangeEvent, useEffect, useState } from "react"
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
import { useCreateQuestionTrigger } from "@/stores/trigger.store"
import { toast } from "react-toastify"

export default function CreateExaminationPage() {
    const params = useSearchParams()
    const _id = params.get('id')
    const [exam, setExam] = useState<ExamResponse | null>(null)
    const [isNewQuestion, setIsNewQuestion] = useState<boolean>(false)
    const [isNestedQuestion, setIsNestedQuestion] = useState<boolean>(false)
    const { questionList, setQuestionList, initializeQuestionList } = useQuestionListStore()
    const { nestedQuestions, setNestedQuestions } = useNestedQuestionsStore()
    const [activeId, setActiveId] = useState<number | null>(null)
    const { trigger, setTrigger } = useCreateQuestionTrigger()

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
    }, [_id, trigger])

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

    const onAikenImportClick = () => {
        const el = document.getElementById('aiken-import')
        if (el) {
            el.click()
            el.addEventListener('change', async (e: Event) => {
                const file = (e as unknown as ChangeEvent<HTMLInputElement>).target.files?.[0]
                if (file) {
                    const formData = new FormData()
                    formData.append('file', file)
                    try {
                        const res = await clientAPI.post('/upload/aiken', formData, {
                            headers: {
                                "Content-Type": "multipart/form-data",
                            },
                        })
                        
                        const { message, code, data } = res.data

                        for(let i = 0; i < data.length; i++) {
                            const update = await clientAPI.post(`exam/question/${_id}`, res.data.data[i])
                            if(code == 200) {
                                toast.success(update.data.message)
                            }
                        }

                        setTrigger(!trigger)
                        
                    } catch (error) {
                        console.error('Error uploading file:', error)
                    }
                }
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
                                        <DropdownItem onPress={onAikenImportClick} startContent={<IcRoundFolder />} description="" key="import-aiken">
                                            <h1>Import Aiken</h1>
                                            <span className="text-tiny text-foreground/50">Import your question using an Aiken file.</span>
                                            <label className="relative">
                                                <Input
                                                    className="absolute inset-0 opacity-0"
                                                    id="aiken-import" type="file" variant="faded"
                                                    size="sm" accept=".txt"
                                                />
                                            </label>

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
                                            <div className="flex gap-x-3" key={index}>
                                                <DraggableQuestion question={question} id={question.id} />
                                                <Tooltip content="Delete question">
                                                    <Button
                                                        size="sm"
                                                        isIconOnly
                                                        variant="flat"
                                                        color="danger"
                                                        className="hover:animate-pulse"
                                                    >
                                                        <MdiBin fontSize={16} />
                                                    </Button>
                                                </Tooltip>
                                            </div>

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