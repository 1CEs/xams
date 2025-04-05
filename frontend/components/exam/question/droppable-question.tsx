import { useDroppable } from '@dnd-kit/core'
import { ReactNode } from 'react'

interface DroppableQuestionProps {
    id: string
    children: ReactNode
}

const DroppableQuestion = ({ id, children }: DroppableQuestionProps) => {
    const { setNodeRef, isOver } = useDroppable({
        id,
    })
    
    return (
        <div
            ref={setNodeRef}
            className={` w-full border-2 border-dashed rounded-lg p-4 transition-colors ${
                isOver ? 'border-primary bg-primary/10' : 'border-secondary'
            }`}
        >
            {children}
        </div>
    )
}

export default DroppableQuestion