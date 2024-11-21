import { questionDummy } from "@/mock/question.mock"
import { create } from "zustand"

type QuestionListState = {
    questionList: QuestionWithIdentifier<QuestionForm>[]
    setQuestionList: (
        questions: (prevState: QuestionWithIdentifier<QuestionForm>[]) => QuestionWithIdentifier<QuestionForm>[]
    ) => void
}

export const useQuestionListStore = create<QuestionListState>((set) => ({
    questionList: questionDummy,
    setQuestionList: (updateFn) =>
        set((state) => {
            const updatedList = updateFn(state.questionList)
            return { questionList: updatedList }
        }),
}))

