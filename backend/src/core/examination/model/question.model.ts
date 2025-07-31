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
            // Only require expectedAnswers for Short Essay (SES) questions
            // Long Essay (LES) questions can have optional expected answers
            return this.type === 'ses';
        },
        default: []
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
