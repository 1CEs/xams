import mongoose from "mongoose";
import { QuestionDocument } from "../../../types/exam";

const { Schema } = mongoose

export const QuestionSchema = new Schema<QuestionDocument>({
    type: {
        type: Schema.Types.String,
        required: true
    },
    content: {
        type: Schema.Types.String,
        required: true
    },
    contents: { type: [Schema.Types.String] },
    choices: { type: [Schema.Types.String] },
    correct: { 
        type: [Schema.Types.String], 
        required: true
    },
    score: {
        type: Schema.Types.Number,
        required: true
    }
})