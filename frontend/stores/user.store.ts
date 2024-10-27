import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface IUserStore {
    user: UserResponse | null
    setUser: (user: UserResponse) => void
}

export const useUserStore = create(
    persist<IUserStore>(
        (set) => ({
            user: null,
            setUser: (user: UserResponse) => set({ user })
        }),
        {
            name: 'user',
            storage: createJSONStorage(() => localStorage)
        }
    )
)