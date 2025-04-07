import mongoose from "mongoose";
import { QuestionDocument } from "../../../types/exam";

const { Schema } = mongoose;

const QuestionSchema = new Schema<QuestionDocument>({
    type: {
        type: Schema.Types.String,
        required: true,
        enum: ['mc', 'tf', 'ses', 'les', 'nested']
    },
    question: {
        type: Schema.Types.String,
        required: true
    },
    isRandomChoices: {
        type: Schema.Types.Boolean,
        default: false
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
        type: Schema.Types.Boolean,
        required: function () {
            return this.type === 'tf';
        },
        default: false
    },
    expectedAnswer: {
        type: Schema.Types.String,
        required: function () {
            return this.type === 'ses' || this.type === 'les';
        },
        default: ''
    },
    maxWords: {
        type: Schema.Types.Number,
        required: function () {
            return this.type === 'les';
        },
        default: 0
    },
    score: {
        type: Schema.Types.Number,
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
