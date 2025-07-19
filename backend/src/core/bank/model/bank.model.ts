import mongoose, { Document } from "mongoose";
import { SubBankSchema } from "./sub-bank.model";
import { IBank } from "./interface/ibank";

const { Schema, model } = mongoose;

export const BankSchema = new Schema<IBank & Document>({
    bank_name: {
        type: Schema.Types.String,
        required: true
    },
    exam_ids: {
        type: [Schema.Types.String],
        default: []
    },
    sub_banks: {
        type: [SubBankSchema],
        default: []
    }
}, { _id: true, timestamps: true });

export const BankModel = model('banks', BankSchema);
