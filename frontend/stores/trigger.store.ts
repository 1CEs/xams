import { create } from "zustand";

interface CreateQuestionTrigger {
    trigger: boolean;
    setTrigger: (trigger: boolean) => void;
}

export const useCreateQuestionTrigger = create<CreateQuestionTrigger>((set) => ({
    trigger: false,
    setTrigger: (trigger: boolean) => set(() => ({ trigger })),
}))