import { CarbonTextLongParagraph, HealthiconsIExamMultipleChoice, MdiDrag, PajamasFalsePositive, UilParagraph } from "@/components/icons/icons"
import { useDndContext } from "@dnd-kit/core"
import { useSortable } from "@dnd-kit/sortable"
import { Accordion, AccordionItem, Card, CardBody, CardHeader, Divider, Spinner, Checkbox, Button, Textarea, CardFooter, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@nextui-org/react"
import { CSS } from "@dnd-kit/utilities"
import { extractHtml } from "@/utils/extract-html"
import { useState } from "react"
import { IconParkTwotoneNestedArrows } from "@/components/icons/icons"

interface DraggableQuestionProps {
    question: QuestionForm
    id: number
    disableDrag?: boolean
}

const DraggableQuestion = ({ id, question, disableDrag }: DraggableQuestionProps) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({
        id,
        animateLayoutChanges: () => false,
        disabled: disableDrag
    })

    const { active } = useDndContext()
    const isDragging = active?.id === id

    const [isOpen, setIsOpen] = useState<boolean>(false)

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 1000 : undefined,
    }

    const extractedQuestion = extractHtml(question.question)
    const extractedChoices = question.choices?.map((choice: { content: string; isCorrect: boolean; }) => extractHtml(choice.content)) || []

    const matchQuestionType = (type: QuestionSelector) => {
        switch (type) {
            case "tf":
                return "True or False"
            case "les":
                return "Long Essay"
            case "mc":
                return "Multiple Choice"
            case "ses":
                return "Short Essay"
            case "nested":
                return "Nested Question"
            default:
                return "Unknown"
        }
    }

    const matchIconType = {
        tf: <PajamasFalsePositive />,
        les: <CarbonTextLongParagraph />,
        mc: <HealthiconsIExamMultipleChoice />,
        ses: <UilParagraph />,
        nested: <IconParkTwotoneNestedArrows />
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...(disableDrag ? {} : listeners)}
            className={`${disableDrag ? 'cursor-default' : 'cursor-move'} w-[400px] max-w-[500px]`}
        >
            <Card>
                <CardHeader>
                    <div className="flex gap-3 justify-between w-full">
                        <div className="flex items-center justify-between gap-3">
                            {!disableDrag && <MdiDrag className="text-gray-400" />}
                            {matchIconType[question.type as keyof typeof matchIconType]}
                            <div className="flex flex-col">
                                <p className="text-md line-clamp-1">{extractedQuestion.substring(0, 30)}...</p>
                                <p className="text-tiny">{matchQuestionType(question.type)}</p>
                                <p className="text-small text-default-500">Score: {question.score}</p>
                            </div>
                        </div>
                        <Button onPress={() => setIsOpen(!isOpen)} variant="flat" color="secondary" size="sm">
                            {isOpen ? "Hide" : "Show"}
                        </Button>
                    </div>
                </CardHeader>
                {isOpen && <Divider />}
                {isOpen && <CardBody>
                    <p className="line-clamp-2">{extractedQuestion}</p>
                    {question.type === 'mc' && (
                        <div className="mt-4">
                            {extractedChoices.map((choice: string, index: number) => (
                                <div key={index} className="flex items-center gap-2 mb-2">
                                    <Checkbox color="secondary" isSelected={question.choices?.[index]?.isCorrect} />
                                    <span>{choice}</span>
                                </div>
                            ))}
                        </div>
                    )}
                    {question.type === 'tf' && (
                        <div className="mt-4">
                            <p>Correct Answer: {question.isTrue ? 'True' : 'False'}</p>
                        </div>
                    )}
                    {(question.type === 'ses' || question.type === 'les') && (
                        <div className="mt-4">
                            <p>Expected Answer: {extractHtml(question.expectedAnswer || '')}</p>
                            {question.type === 'les' && (
                                <p className="text-small text-default-500">Max Words: {question.maxWords}</p>
                            )}
                        </div>
                    )}
                    {question.type === 'nested' && question.questions && (
                        <div className="mt-4">
                            <p className="font-semibold mb-2">Sub-questions:</p>
                            <div className="space-y-4">
                                {question.questions.map((subQuestion, index) => (
                                    <div key={index} className="border-l-2 border-gray-200 pl-4">
                                        <p className="text-sm font-medium">{extractHtml(subQuestion.question)}</p>
                                        <p className="text-xs text-gray-500">{matchQuestionType(subQuestion.type)}</p>
                                        <p className="text-xs text-gray-500">Score: {subQuestion.score}</p>
                                        {subQuestion.type === 'mc' && subQuestion.choices && (
                                            <div className="mt-2">
                                                {subQuestion.choices.map((choice, choiceIndex) => (
                                                    <div key={choiceIndex} className="flex items-center gap-2 mb-1">
                                                        <Checkbox color="secondary" isSelected={choice.isCorrect} />
                                                        <span className="text-xs">{extractHtml(choice.content)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        {subQuestion.type === 'tf' && (
                                            <p className="text-xs mt-1">Correct Answer: {subQuestion.isTrue ? 'True' : 'False'}</p>
                                        )}
                                        {(subQuestion.type === 'ses' || subQuestion.type === 'les') && (
                                            <div className="mt-2">
                                                <p className="text-xs">Expected Answer: {extractHtml(subQuestion.expectedAnswer || '')}</p>
                                                {subQuestion.type === 'les' && (
                                                    <p className="text-xs text-gray-500">Max Words: {subQuestion.maxWords}</p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </CardBody>}
            </Card>
        </div>
    )
}

export default DraggableQuestion