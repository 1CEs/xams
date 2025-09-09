import mongoose, { Mongoose } from "mongoose"
import { IDatabase } from "./interface/idatabase";

export class Database implements IDatabase {
    database: Mongoose

    constructor() {
        this.database = mongoose
    }

    async connect(connectionString: string) {
        try {
            return { db: await this.database.connect(connectionString, { authSource: 'admin', dbName: 'xams-db' }), err: null }
        } catch (error) {
            return { db: null, err: error as string }
        }
    }
}