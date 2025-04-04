import { CarbonTextLongParagraph, HealthiconsIExamMultipleChoice, MdiDrag, PajamasFalsePositive, UilParagraph } from "@/components/icons/icons"
import { useDndContext } from "@dnd-kit/core"
import { useSortable } from "@dnd-kit/sortable"
import { Accordion, AccordionItem, Card, CardBody, CardHeader, Divider, Spinner, Checkbox, Button, Textarea, CardFooter, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@nextui-org/react"
import { CSS } from "@dnd-kit/utilities"
import { extractHtml } from "@/utils/extract-html"
import { useState } from "react"

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
    const extractedChoices = question.choices?.map((choice) => extractHtml(choice)) || []

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
            default:
                return "Unknown"
        }
    }

    const matchIconType = {
        tf: <PajamasFalsePositive />,
        les: <CarbonTextLongParagraph />,
        mc: <HealthiconsIExamMultipleChoice />,
        ses: <UilParagraph />
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={`${disableDrag ? 'cursor-not-allowed' : 'cursor-move'} w-[400px] max-w-[500px]`}

        >

            <Card>
                <CardHeader>
                    <div className="flex gap-3 w-full">
                        <div className="flex items-center justify-between gap-3">
                            {matchIconType[question.type]}
                            <div className="flex flex-col">
                                <p className="text-md">{matchQuestionType(question.type)}</p>
                                <p className="text-small text-default-500">Score: {question.score}</p>
                            </div>
                        </div>
                    </div>

                    <Button onPress={() => setIsOpen(!isOpen)} variant="flat" color="secondary" size="sm">Show</Button>
                </CardHeader>
                {isOpen && <Divider />}
                {isOpen && <CardBody>
                    <p className="line-clamp-2">{extractedQuestion}</p>
                    {question.type === 'mc' && (
                        <div className="mt-4">
                            {extractedChoices.map((choice, index) => (
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
                </CardBody>}
            </Card>
        </div>
    )
}

export default DraggableQuestion
