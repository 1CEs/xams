import mongoose from "mongoose";
import { QuestionDocument } from "../../../types/exam";

const { Schema } = mongoose

export const QuestionSchema = new Schema<QuestionDocument>({
    type: {
        type: Schema.Types.String,
        required: true,
        enum: ['mc', 'tf', 'ses', 'les']
    },
    question: {
        type: Schema.Types.String,
        required: true
    },
    // For multiple choice questions
    choices: { 
        type: [{
            content: String,
            isCorrect: Boolean
        }],
        required: function() {
            return this.type === 'mc';
        }
    },
    // For true/false questions
    isTrue: {
        type: Schema.Types.Boolean,
        required: function() {
            return this.type === 'tf';
        }
    },
    // For essay questions (both short and long)
    expectedAnswer: {
        type: Schema.Types.String,
        required: function() {
            return this.type === 'ses' || this.type === 'les';
        }
    },
    // For essay questions - maximum word count
    maxWords: {
        type: Schema.Types.Number,
        required: function() {
            return this.type === 'les';
        }
    },
    score: {
        type: Schema.Types.Number,
        required: true
    }
}, { _id: true })