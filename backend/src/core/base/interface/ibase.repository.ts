export interface IBaseRepository<T> {
    save: (payload: Partial<T>) => Promise<(T) | null>
    find: () => Promise<(T)[] | null>
    findById: (_id: string) => Promise<(T) | null>
    update: (_id: string, payload: Partial<T>) => Promise<(T) | null>
    delete: (_id: string) => Promise<(T) | null>
}