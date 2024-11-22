import { GrommetIconsDropbox, MdiBin, MingcuteAddFill } from "@/components/icons/icons"
import { StepProvider } from "@/components/provider"
import TextEditor from "@/components/text-editor"
import { Button, Card, CardBody, CardHeader, Tooltip } from "@nextui-org/react"
import { Formik } from "formik"
import React from "react"
import {
    SortableContext,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import DraggableQuestion from "./draggable-question"
import DroppableQuestion from "./droppable-question"
import { useNestedQuestionsStore } from "@/stores/question.store/nested-question.store"
import { useQuestionListStore } from "@/stores/question.store/question-list.store"


const NestedQuestionForm = () => {
    const { nestedQuestions, setNestedQuestions } = useNestedQuestionsStore()
    const { setQuestionList } = useQuestionListStore()

    const onDeleteQuestion = (id: number) => {
        const questionToRemove = nestedQuestions.find((q) => q.id === id)

        if (questionToRemove) {
            setNestedQuestions((prevQuestions) =>
                prevQuestions.filter((question) => question.id !== id)
            )
            setQuestionList((prevQuestions) => [...prevQuestions, questionToRemove])
        }
    }


    return (
        <Formik
            initialValues={{
                question: "",
                questions: [],
            }}
            onSubmit={(values) => {
                console.log(values)
            }}
        >
            {({ handleSubmit }) => (
                <form className="col-span-2 pl-32" onSubmit={handleSubmit}>
                    <Card>
                        <CardHeader>
                            <div className="flex gap-x-4">
                                <Button size="sm" color="success" type="submit">
                                    Save
                                </Button>
                                <Button size="sm">Save and add new question</Button>
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
                                    <Button
                                        startContent={<MingcuteAddFill />}
                                        size="sm"
                                        onClick={() => {
                                            // Add logic to add a new question
                                        }}
                                    >
                                        Add
                                    </Button>
                                    <div className="flex gap-y-8 mt-4">
                                        <SortableContext
                                            items={nestedQuestions && nestedQuestions.map((q) => q.id)}
                                            strategy={verticalListSortingStrategy}
                                        >
                                            <DroppableQuestion id="nested-questions">
                                                {nestedQuestions && nestedQuestions.length === 0 && (
                                                    <div className="text-md text-secondary gap-x-3 flex w-full h-full justify-center items-center">
                                                        <GrommetIconsDropbox fontSize={24} />
                                                        <p>Drag and drop questions here</p>
                                                    </div>
                                                )}
                                                {nestedQuestions && nestedQuestions.map((question, index) => (
                                                    <div
                                                        key={question.id}
                                                        className="flex gap-x-3 justify-between items-center pb-2"
                                                    >
                                                        <DraggableQuestion
                                                            id={question.id}
                                                            question={question}
                                                            disableDrag={true}
                                                        />
                                                        <Tooltip content="Pop the question back">
                                                            <Button
                                                                className="hover:animate-pulse"
                                                                size="sm"
                                                                variant="flat"
                                                                color="danger"
                                                                onPress={() => onDeleteQuestion(question.id)}
                                                                isIconOnly
                                                            >
                                                                <MdiBin fontSize={16} />
                                                            </Button>
                                                        </Tooltip>
                                                    </div>
                                                ))}
                                            </DroppableQuestion>
                                        </SortableContext>
                                    </div>
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

