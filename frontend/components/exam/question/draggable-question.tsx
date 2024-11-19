import { MdiDrag } from "@/components/icons/icons";
import { useDraggable } from "@dnd-kit/core";
import { Card, CardBody } from "@nextui-org/react";

interface DraggableQuestionProps {
    id: string;
    children: React.ReactNode;
}

const DraggableQuestion = ({ id, children }: DraggableQuestionProps) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id,
    });

    const style = {
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
        zIndex: isDragging ? 10 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`flex items-center ${isDragging ? "opacity-75 border-secondary border-r-2" : ""}`}
        >

            <Card
                className="shadow-md border border-default bg-background w-full"
            >
                <CardBody>{children}</CardBody>
            </Card>
            <div
                {...listeners}
                {...attributes}
                className="text-3xl cursor-grab active:cursor-grabbing flex justify-center"
            >
                <MdiDrag />
            </div>
        </div>
    );
}

export default DraggableQuestion;