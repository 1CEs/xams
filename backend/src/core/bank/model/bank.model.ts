import mongoose, { Document } from "mongoose";
import { SubBankSchema } from "./sub-bank.model";
import { IBank } from "./interface/ibank";

const { Schema, model } = mongoose;

export const BankSchema = new Schema<IBank & Document>({
    bank_name: {
        type: Schema.Types.String,
        required: true
    },
    exam_id: {
        type: Schema.Types.String,
        required: true
    },
    sub_banks: {
        type: [SubBankSchema],
        default: []
    }
});

export const BankModel = model('banks', BankSchema);
