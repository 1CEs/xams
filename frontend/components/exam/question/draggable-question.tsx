import { CarbonTextLongParagraph, HealthiconsIExamMultipleChoice, MdiDrag, PajamasFalsePositive, UilParagraph } from "@/components/icons/icons"
import { useDndContext } from "@dnd-kit/core"
import { useSortable } from "@dnd-kit/sortable"
import { Accordion, AccordionItem } from "@nextui-org/react"
import { CSS } from "@dnd-kit/utilities"
import { extractHtml } from "@/utils/extract-html"

interface DraggableQuestionProps {
    id: number
    question: QuestionWithIdentifier<QuestionForm>
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

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 1000 : undefined,
    }

    const extractedQuestion = extractHtml(question.question)
    const extractedChoices = question.choices.map((choice) => extractHtml(choice))
    const extractedAnswer = question.answer.map((answer) => extractHtml(answer))

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
            className={`flex w-full items-center rounded-lg shadow-md ${isDragging ? "opacity-75 border border-secondary shadow-lg" : ""}`}
        >
            <Accordion variant="splitted" isCompact className="w-full">
                <AccordionItem
                    startContent={matchIconType[question.type]}
                    title={
                        <div className="flex justify-between items-center">
                            <span className="truncate w-5/6 text-sm font-medium">
                                {question.id + ". "}{extractedQuestion.length > 50 ? `${extractedQuestion.slice(0, 50)}...` : extractedQuestion}
                            </span>
                            {!disableDrag && (
                                <span
                                    {...listeners}
                                    {...attributes}
                                    className="text-xl cursor-grab active:cursor-grabbing ml-2"
                                >
                                    <MdiDrag />
                                </span>
                            )}
                        </div>
                    }
                >
                    <div className="flex flex-col text-sm space-y-2">
                        <Accordion>
                            <AccordionItem
                                title={<span className="truncate text-sm font-medium">Choices ({question.choices.length})</span>}
                                isCompact
                            >
                                <ul className="list-disc ml-4">
                                    {extractedChoices.map((choice, index) => (
                                        <li key={index}>{choice}</li>
                                    ))}
                                </ul>
                            </AccordionItem>
                        </Accordion>

                        <Accordion>
                            <AccordionItem
                                title={<span className="truncate text-sm font-medium">Answer ({question.answer.length})</span>}
                                isCompact
                            >
                                <ul className="list-disc ml-4">
                                    {extractedAnswer.map((answer, index) => (
                                        <li key={index}>{answer}</li>
                                    ))}
                                </ul>
                            </AccordionItem>
                        </Accordion>
                        <div className="flex justify-between items-center font-bold">
                            <span className="text-tiny text-foreground/50">{matchQuestionType(question.type)}</span>
                            <span className="text-tiny text-foreground/50">{question.score + " "}<span className="text-danger">*</span></span>
                        </div>
                    </div>
                </AccordionItem>
            </Accordion>
        </div>
    )
}

export default DraggableQuestion
