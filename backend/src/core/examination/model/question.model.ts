import mongoose from "mongoose";
import { QuestionDocument } from "../../../types/exam";

const { Schema } = mongoose

export const QuestionSchema = new Schema<QuestionDocument>({
    type: {
        type: Schema.Types.String,
        required: true
    },
    question: {
        type: Schema.Types.String,
        required: true
    },
    choices: { type: [Schema.Types.String] },
    answer: { type: [Schema.Types.String] },
    score: {
        type: Schema.Types.Number,
        required: true
    }
}, { _id: true })