import { Document, Model } from "mongoose"
import { IBaseRepository } from "./interface/ibase.repository"

export class BaseRepository<T extends Document> implements IBaseRepository<T> {
    protected _model: Model<T>

    constructor(model: Model<T>) {
        this._model = model
    }

    async save(payload: Partial<T>) {
        const document = await new this._model(payload).save()
        return document as T & Document
    }

    async find(filter = {}, projection?: any) {
        return await this._model.find(filter, projection).exec()
    }

    async findById(_id: string, projection?: any) {
        return await this._model.findById(_id, projection).exec()
    }

    async update(_id: string, payload: Partial<T>, projection?: any) {
        return await this._model.findByIdAndUpdate(_id, payload, { new: true, projection }).exec()
    }

    async delete(_id: string) {
        return await this._model.findByIdAndDelete(_id).exec()
    }
} 