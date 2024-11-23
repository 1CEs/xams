import { create } from "zustand"

type QuestionListState = {
    questionList: QuestionWithIdentifier<QuestionForm>[]
    setQuestionList: (
        questions: (prevState: QuestionWithIdentifier<QuestionForm>[]) => QuestionWithIdentifier<QuestionForm>[]
    ) => void
    initializeQuestionList: (questions: QuestionWithIdentifier<QuestionForm>[]) => void
}

export const useQuestionListStore = create<QuestionListState>((set) => ({
    questionList: [],
    setQuestionList: (updateFn) =>
        set((state) => {
            const updatedList = updateFn(state.questionList);
            return { questionList: updatedList };
        }),
    initializeQuestionList: (questions: QuestionWithIdentifier<QuestionForm>[]) =>
        set(() => {
            const newQuestions = questions.map((question, index) => ({
                ...question,
                id: index + 1, 
            }));
            return { questionList: newQuestions }
        }),
}))

