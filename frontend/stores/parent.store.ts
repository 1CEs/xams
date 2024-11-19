import { create } from "zustand";

interface IParentStore {
    parent: string[] | null;
    setParent: (parent: string | string[] | null) => void;
}

export const useParentStore = create<IParentStore>((set) => ({
    parent: null,
    setParent: (parent: string | string[] | null) =>
        set((state) => {
            const processedParent = parent
                ? Array.isArray(parent)
                    ? parent
                    : [parent]
                : null;

            return { parent: processedParent };
        }),
}));