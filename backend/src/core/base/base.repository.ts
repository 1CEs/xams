import { Document, Model } from "mongoose"
import { IBaseRepository } from "./interface/ibase.repository"

export class BaseRepository<T extends Document> implements IBaseRepository<T> {
    protected _model: Model<T>

    constructor(model: Model<T>) {
        this._model = model
    }

    async save(payload: Partial<T>) {
        await this._model.init()
        const document = await this._model.create(payload)
        return document as T & Document
    }

    async find() {
        return await this._model.find().exec()
    }

    async findById(_id: string) {
        return await this._model.findById(_id).exec()
    }

    async update(_id: string, payload: Partial<T>) {
        return await this._model.findByIdAndUpdate(_id, payload, { new: true }).exec()
    }

    async delete(_id: string) {
        return await this._model.findByIdAndDelete(_id).exec()
    }
} 