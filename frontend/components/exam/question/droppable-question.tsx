import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import React from "react";

type Props = {
    id: string;
    children?: React.ReactNode;
};

const DroppableQuestion = ({ id, children }: Props) => {
    const { isOver, setNodeRef } = useDroppable({
        id,
    })

    const style = {
        backgroundColor: isOver ? "rgba(0, 128, 0, 0.1)" : "#101010",
    }

    return (
        <SortableContext id={id} items={[]} strategy={verticalListSortingStrategy}>
            <div ref={setNodeRef} style={style} className="rounded-md w-3/4 border-secondary border-dashed border-2 min-h-[300px] max-h-fit p-6">
                {children || "Drop here"}
            </div>
        </SortableContext>

    )
}

export default DroppableQuestion;