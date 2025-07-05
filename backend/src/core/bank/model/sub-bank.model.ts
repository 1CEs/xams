import mongoose, { Document } from "mongoose";
import { ISubBank } from "./interface/isub-bank";

const { Schema } = mongoose;

// Create a schema for SubBank with recursive structure
export const SubBankSchema = new Schema<ISubBank & Document>({
    name: {
        type: Schema.Types.String,
        required: true
    },
    parent_id: {
        type: Schema.Types.String,
        required: false
    },
    sub_banks: {
        type: [/* placeholder for recursion */],
        default: []
    }
}, { _id: true });

// Add recursive self-reference for nested sub-banks
SubBankSchema.add({
    sub_banks: {
        type: [SubBankSchema],
        default: []
    }
});

export const SubBankModel = mongoose.model('sub_banks', SubBankSchema);
