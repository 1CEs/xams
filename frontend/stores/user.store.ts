import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface IUserStore {
    user: UserResponse | null
    setUser: (user: UserResponse | null) => void
}

export const useUserStore = create(
    persist<IUserStore>(
        (set) => ({
            user: null,
            setUser: (user: UserResponse | null) => {
                // Add validation to ensure user object structure is correct
                if (user && user.status && typeof user.status === 'object') {
                    // Ensure is_banned is properly typed as boolean
                    if (typeof user.status.is_banned !== 'boolean') {
                        console.warn('Invalid is_banned type detected, converting to boolean')
                        user.status.is_banned = Boolean(user.status.is_banned)
                    }
                }
                set({ user })
            }
        }),
        {
            name: 'user',
            storage: createJSONStorage(() => localStorage)
        }
    )
)