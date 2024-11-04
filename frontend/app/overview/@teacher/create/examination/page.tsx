"use client"

import NewQuestionForm from "@/components/exam/new-question-form";
import { IconParkOutlineCheckCorrect, MdiBin, MingcuteAddFill, MingcuteFileNewFill, SystemUiconsReuse } from "@/components/icons/icons";
import { clientAPI } from "@/config/axios.config";
import { errorHandler } from "@/utils/error";
import { Button, Card, CardBody, CardFooter, CardHeader, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger, Input, Textarea } from "@nextui-org/react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function CreateExaminationPage() {
    const params = useSearchParams()
    const _id = params.get('id')
    const [exam, setExam] = useState<ExamResponse | null>(null)
    const [isNewQuestion, setIsNewQuestion] = useState<boolean>(false)

    useEffect(() => {
        const getExam = async () => {
            try {
                const res = await clientAPI.get(`exam/${_id}`)
                setExam(res.data.exam)
            } catch (error) {
                errorHandler(error)
            }
        }
        getExam()
    }, [_id])

    if (exam) {
        return (
            <div className="grid grid-cols-3">
                <div className="col-span-1 flex flex-row-reverse gap-x-6">
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
                                    key="new"
                                    onPress={() => setIsNewQuestion(true)}
                                    isDisabled={isNewQuestion}
                                    className={`${isNewQuestion ? 'cursor-not-allowed' : ''}`}
                                >
                                    New Question
                                </DropdownItem>
                                <DropdownItem startContent={<SystemUiconsReuse />} description='' key="copy">
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
                {isNewQuestion ?
                    <NewQuestionForm />
                    : null
                }
            </div>
        )
    } else {
        return (
            <div>No content</div>
        )
    }


}