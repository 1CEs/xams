import mongoose from "mongoose";
import { QuestionDocument } from "../../../types/exam";

const { Schema } = mongoose;

const QuestionSchema = new Schema<QuestionDocument>({
    type: {
        type: String,
        required: true,
        enum: ['mc', 'tf', 'ses', 'les', 'nested']
    },
    question: {
        type: String,
        required: true
    },
    isRandomChoices: {
        type: Boolean,
        default: true
    },
    choices: {
        type: [{
            content: String,
            isCorrect: Boolean,
            score: {
                type: Number,
                default: 0
            }
        }],
        required: function () {
            return this.type === 'mc';
        },
        default: []
    },
    isTrue: {
        type: Boolean,
        required: function () {
            return this.type === 'tf';
        },
        default: false
    },
    expectedAnswers: {
        type: [String],
        required: function () {
            return this.type === 'ses' || this.type === 'les';
        },
        default: []
    },
    maxWords: {
        type: Number,
        required: function () {
            return this.type === 'les';
        },
        default: 0
    },
    score: {
        type: Number,
        required: true
    },
    questions: [/* placeholder for recursion */]
}, { _id: true });

// 🧠 Recursive self-reference
QuestionSchema.add({
    questions: {
        type: [QuestionSchema],
        required: function () {
            return this.type === 'nested';
        },
        default: []
    }
});

export { QuestionSchema };
