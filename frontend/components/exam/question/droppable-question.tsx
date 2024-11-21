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
        backgroundColor: isOver ? "rgba(0, 128, 0, 0.1)" : "transparent",
        border: "2px dashed #ccc",
        padding: "16px",
        height: "200px",
    }

    return (
        <SortableContext id={id} items={[]} strategy={verticalListSortingStrategy}>
            <div ref={setNodeRef} style={style} className="rounded-md w-full">
                {children || "Drop here"}
            </div>
        </SortableContext>

    )
}

export default DroppableQuestion;