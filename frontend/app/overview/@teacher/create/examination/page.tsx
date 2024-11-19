"use client"

import NewQuestionForm from "@/components/exam/new-question-form";
import DraggableQuestion from "@/components/exam/question/draggable-question";
import NestedQuestionForm from "@/components/exam/question/nested-question";
import { IconParkOutlineCheckCorrect, IconParkTwotoneNestedArrows, MdiBin, MingcuteAddFill, MingcuteFileNewFill, SystemUiconsReuse } from "@/components/icons/icons";
import { clientAPI } from "@/config/axios.config";
import { useParentStore } from "@/stores/parent.store";
import { errorHandler } from "@/utils/error";
import { DndContext } from "@dnd-kit/core";
import { Button, Card, CardBody, CardFooter, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger, Input, Textarea, useDisclosure } from "@nextui-org/react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function CreateExaminationPage() {
    const params = useSearchParams()
    const _id = params.get('id')
    const [exam, setExam] = useState<ExamResponse | null>(null)
    const [isNewQuestion, setIsNewQuestion] = useState<boolean>(false)
    const [isNestedQuestion, setIsNestedQuestion] = useState<boolean>(false)
    const { parent, setParent } = useParentStore()

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

    const handleDragEnd = (e: any) => {
        const { over } = e;
        if (over) {
            setParent(over.id)
            console.log(parent)
        }
    }

    if (exam) {
        return (
            <DndContext onDragEnd={handleDragEnd}>
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
                            <DraggableQuestion id="1">Question 1</DraggableQuestion>
                            <DraggableQuestion id="2">Question 2</DraggableQuestion>
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