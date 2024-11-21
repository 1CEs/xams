import { create } from "zustand"

type NestedQuestionsState = {
    nestedQuestions: QuestionWithIdentifier<QuestionForm>[]
    setNestedQuestions: (
        questions: (prevState: QuestionWithIdentifier<QuestionForm>[]) => QuestionWithIdentifier<QuestionForm>[]
    ) => void
}

export const useNestedQuestionsStore = create<NestedQuestionsState>((set) => ({
    nestedQuestions: [],
    setNestedQuestions: (updateFn) =>
        set((state) => {
            const updatedList = updateFn(state.nestedQuestions)
            return { nestedQuestions: updatedList }
        }),
}))