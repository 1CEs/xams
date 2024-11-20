import { MdiDrag } from "@/components/icons/icons";
import { useDndContext } from "@dnd-kit/core";
import { defaultAnimateLayoutChanges, useSortable } from "@dnd-kit/sortable";
import { Accordion, AccordionItem } from "@nextui-org/react";
import { CSS } from "@dnd-kit/utilities";

interface DraggableQuestionProps {
    id: number
    question: QuestionWithIdentifier<QuestionForm>
}

const DraggableQuestion = ({ id, question }: DraggableQuestionProps) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({
        id,
        animateLayoutChanges: () => false
    });

    const { active } = useDndContext();

    const isDragging = active?.id === id;

    const style = {
        transform: CSS.Transform.toString(transform),
        transition
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`flex items-center ${isDragging && "opacity-75 border-secondary border-r-2"}`}
            {...listeners}
            {...attributes}
        >

            <Accordion variant="splitted" isCompact>
                <AccordionItem title={question.question.slice(0, 50)}>
                    {question.type}
                </AccordionItem>

            </Accordion>
            <div

                className="text-3xl cursor-grab active:cursor-grabbing flex"
            >
                <MdiDrag />
            </div>
        </div>
    );
}

export default DraggableQuestion;