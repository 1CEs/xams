import { create } from "zustand"

interface IDraggableQuestionStore {
    question: QuestionForm[] | null
    setQuestion: (question: QuestionForm) => void
}

export const useDraggedQuestionStore = create<IDraggableQuestionStore>((set) => ({
    question: null,
    setQuestion: (question: QuestionForm) => set((state) => ({ question: [...(state.question || []), question] }))
}))
