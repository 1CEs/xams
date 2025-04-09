import { Document } from "mongoose"

export interface IBaseRepository<T extends Document> {
    save: (payload: Partial<T>) => Promise<T & Document>
    find: (filter?: any, projection?: any) => Promise<T[]>
    findById: (_id: string, projection?: any) => Promise<T | null>
    update: (_id: string, payload: Partial<T>, projection?: any) => Promise<T | null>
    delete: (_id: string) => Promise<T | null>
}