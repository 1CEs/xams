import { ObjectId } from "mongoose";

export interface ISubmittedAnswer {
    question_id: string;
    submitted_question: string;
    question_type: 'mc' | 'tf' | 'ses' | 'les' | 'nested';
    submitted_choices?: string[]; // For multiple choice - array of selected choice contents
    submitted_answer?: string; // For text-based answers (short/long essay)
    submitted_boolean?: boolean; // For true/false questions
    is_correct?: boolean; // Calculated after grading
    score_obtained?: number; // Score obtained for this question
    max_score: number; // Maximum possible score for this question
    // Original question choices for display
    original_choices?: Array<{
        content: string;
        isCorrect: boolean;
    }>;
}

export interface IExamSubmission {
    _id?: string;
    schedule_id: string; // Reference to the exam schedule
    student_id: string; // Reference to the student who submitted
    course_id: string; // Reference to the course
    group_id: string; // Reference to the group
    
    // Submission details
    submitted_answers: ISubmittedAnswer[];
    submission_time: Date;
    time_taken?: number; // Time taken in seconds
    
    // Grading information
    total_score?: number; // Total score obtained
    max_possible_score: number; // Maximum possible score
    percentage_score?: number; // Percentage score
    is_graded: boolean; // Whether the submission has been graded
    graded_at?: Date; // When it was graded
    graded_by?: string; // Who graded it (instructor_id)
    
    // Status
    status: 'submitted' | 'graded' | 'reviewed'; // Submission status
    attempt_number: number; // Which attempt this is (1, 2, 3, etc.)
    
    // Metadata
    created_at: Date;
    updated_at: Date;
}
