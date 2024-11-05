import { Mongoose } from "mongoose";

export interface IDatabase {
    connect: (connectionString: string) => Promise<{ db: Mongoose | null, err: string | null}>
}