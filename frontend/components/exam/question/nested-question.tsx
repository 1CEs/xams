import { MingcuteAddFill } from "@/components/icons/icons";
import { StepProvider } from "@/components/provider";
import TextEditor from "@/components/text-editor";
import { Button, Card, CardBody, CardHeader } from "@nextui-org/react";
import { Formik } from "formik";
import React, { useState } from "react";
import { DndContext, DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove } from "@dnd-kit/sortable";
import DroppableQuestion from "./droppable-question";
import { useParentStore } from "@/stores/parent.store";

type Props = {
    nestedQuestion: QuestionWithIdentifier<QuestionForm>[] | null
}

const NestedQuestionForm = (props: Props) => {
    const { parent, setParent } = useParentStore();
    return (
        <Formik
            initialValues={{
                question: "",
                questions: [],
            }}
            onSubmit={(values) => {
                console.log(values);
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
                                            onClick={() =>{}
                                                
                                            }
                                        >
                                            Add
                                        </Button>
                                        <div className="grid grid-cols-2 gap-4 mt-4">
                                            <SortableContext items={props.nestedQuestion!}>
                                                <DroppableQuestion id="nested-questions">
                                                    {props.nestedQuestion && props.nestedQuestion.map((question) => (
                                                        <div
                                                            key={question.id}
                                                            className="p-4 bg-gray-100 rounded-md border my-2 cursor-pointer"
                                                            id={String(question.id)}
                                                        >
                                                            {question.type}
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
    );
};

export default NestedQuestionForm;
