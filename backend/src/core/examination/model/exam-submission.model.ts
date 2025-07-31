import mongoose from "mongoose";
import { IExamSubmission, ISubmittedAnswer } from "./interface/iexam-submission";

const { Schema } = mongoose;

const SubmittedAnswerSchema = new Schema<ISubmittedAnswer>({
    question_id: {
        type: String,
        required: true
    },
    submitted_question: {
        type: String,
        required: true
    },
    question_type: {
        type: String,
        enum: ['mc', 'tf', 'ses', 'les', 'nested'],
        required: true
    },
    submitted_choices: {
        type: [String],
        required: false // Only for multiple choice questions
    },
    submitted_answer: {
        type: String,
        required: false // Only for essay questions
    },
    submitted_boolean: {
        type: Boolean,
        required: false // Only for true/false questions
    },
    is_correct: {
        type: Boolean,
        required: false // Calculated after grading
    },
    score_obtained: {
        type: Number,
        required: false // Set after grading
    },
    max_score: {
        type: Number,
        required: true
    }
});

const ExamSubmissionSchema = new Schema<IExamSubmission>({
    schedule_id: {
        type: String,
        required: true,
        index: true
    },
    student_id: {
        type: String,
        required: true,
        index: true
    },
    course_id: {
        type: String,
        required: false, // Made optional to support empty strings
        index: true
    },
    group_id: {
        type: String,
        required: false, // Made optional to support empty strings
        index: true
    },
    submitted_answers: {
        type: [SubmittedAnswerSchema],
        required: true
    },
    submission_time: {
        type: Date,
        required: true,
        default: Date.now
    },
    time_taken: {
        type: Number,
        required: false // Time in seconds
    },
    total_score: {
        type: Number,
        required: false // Set after grading
    },
    max_possible_score: {
        type: Number,
        required: true
    },
    percentage_score: {
        type: Number,
        required: false // Calculated after grading
    },
    is_graded: {
        type: Boolean,
        required: true,
        default: false
    },
    graded_at: {
        type: Date,
        required: false
    },
    graded_by: {
        type: String,
        required: false
    },
    status: {
        type: String,
        enum: ['submitted', 'graded', 'reviewed'],
        required: true,
        default: 'submitted'
    },
    attempt_number: {
        type: Number,
        required: true,
        default: 1
    },
    created_at: {
        type: Date,
        required: true,
        default: Date.now
    },
    updated_at: {
        type: Date,
        required: true,
        default: Date.now
    }
});

// Compound indexes for efficient queries
ExamSubmissionSchema.index({ schedule_id: 1, student_id: 1, attempt_number: 1 }, { unique: true });
ExamSubmissionSchema.index({ student_id: 1, course_id: 1 });
ExamSubmissionSchema.index({ schedule_id: 1, status: 1 });

// Update the updated_at field on save
ExamSubmissionSchema.pre('save', function(next) {
    this.updated_at = new Date();
    next();
});

export const ExamSubmissionModel = mongoose.model<IExamSubmission>('Exam_Submission', ExamSubmissionSchema);
