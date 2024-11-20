"use client"

import NewQuestionForm from "@/components/exam/new-question-form";
import DraggableQuestion from "@/components/exam/question/draggable-question";
import NestedQuestionForm from "@/components/exam/question/nested-question";
import { IconParkOutlineCheckCorrect, IconParkTwotoneNestedArrows, MdiBin, MingcuteAddFill, MingcuteFileNewFill, SystemUiconsReuse } from "@/components/icons/icons";
import { clientAPI } from "@/config/axios.config";
import { errorHandler } from "@/utils/error";
import { Button, Card, CardBody, CardFooter, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger, Input, Textarea, useDisclosure } from "@nextui-org/react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
    DndContext,
    DragEndEvent,
    KeyboardSensor,
    PointerSensor,
    closestCenter,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    SortableContext,
    arrayMove,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';

const questionDummy: QuestionWithIdentifier<QuestionForm>[] = [
    {
        id: 1,
        type: 'tf',
        answer: ['true'],
        choices: ['Because...'],
        category: ['Physics'],
        score: 1,
        question: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quae."
    },
    {
        id: 2,
        type: 'mc',
        answer: ['true'],
        choices: ['Because...'],
        category: ['Physics'],
        score: 1,
        question: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quae."
    },
    {
        id: 3,
        type: 'tf',
        answer: ['true'],
        choices: ['Because...'],
        category: ['Physics'],
        score: 1,
        question: "Lorem ipsum dolor sit amet consectetur"
    },
    {
        id: 4,
        type: 'les',
        answer: ['true'],
        choices: ['Because...'],
        category: ['Physics'],
        score: 1,
        question: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quae."
    }
]

export default function CreateExaminationPage() {
    const params = useSearchParams()
    const _id = params.get('id')
    const [exam, setExam] = useState<ExamResponse | null>(null)
    const [isNewQuestion, setIsNewQuestion] = useState<boolean>(false)
    const [isNestedQuestion, setIsNestedQuestion] = useState<boolean>(false)
    const [questionList, setQuestionList] = useState<QuestionWithIdentifier<QuestionForm>[]>(questionDummy);
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        const getExam = async () => {
            try {
                const res = await clientAPI.get(`exam/${_id}`)
                setExam(res.data.data)
            } catch (error) {
                errorHandler(error)
            }
        }
        getExam()
    }, [_id])

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            setQuestionList((items) => {
                const oldIndex = items.findIndex((item) => item.id === active.id);
                const newIndex = items.findIndex((item) => item.id === over.id);

                return arrayMove(items, oldIndex, newIndex);
            });
            console.log(questionList)
        }
    }

    if (exam) {
        return (
            <DndContext 
                onDragEnd={handleDragEnd}
                sensors={sensors}
                collisionDetection={closestCenter}
                modifiers={[restrictToVerticalAxis]}
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
                        <div className="flex flex-col gap-y-3">
                            <SortableContext items={questionList} strategy={verticalListSortingStrategy}>
                                {
                                    questionList.map((question, index) => (
                                        <DraggableQuestion question={question} key={index} id={question.id} />
                                    ))
                                }
                            </SortableContext>

                        </div>
                    </div>
                    {isNewQuestion ?
                        <NewQuestionForm />
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