import { create } from "zustand";

interface IOverStore {
    parent: string | null
    setParent: (parent: string | null) => void
}

export const useUserStore = create<IOverStore>(
    (set) => ({
        parent: null,
        setParent: (parent: string | null) => set({ parent })
    })
)