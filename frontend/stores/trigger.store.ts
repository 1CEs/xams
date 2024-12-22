import { create } from "zustand";

interface ITrigger {
    trigger: boolean;
    setTrigger: (trigger: boolean) => void;
}

export const useTrigger = create<ITrigger>((set) => ({
    trigger: false,
    setTrigger: (trigger: boolean) => set(() => ({ trigger })),
}))