export interface IUserService<T> {
    register: (payload: Partial<T>) => Promise<(T) | null>
    getUsers: () => Promise<(T)[] | null>
    getUserById: (_id: string) => Promise<(T) | null>
    getUserByEmail: (email: string) => Promise<(T) | null>
    getUserByUsername: (username: string) => Promise<(T) | null>
    updateUser: (_id: string, payload: Partial<T>) => Promise<(T) | null>
    deleteUser: (_id: string) => Promise<(T) | null>
}