import { ObjectId } from "mongoose";
import { IQuestion } from "./iquestion";

export interface IExaminationSchedule {
    _id?: string;
    exam_ids: string[];
    instructor_id: string;
    title: string;
    description: string;
    questions: any[];
    created_at: Date;
    
    // Exam settings
    open_time?: Date;
    close_time?: Date;
    ip_range?: string;
    exam_code?: string;
    allowed_attempts?: number;
    allowed_review?: boolean;
    show_answer?: boolean;
    randomize_question?: boolean;
    randomize_choice?: boolean;
    question_count?: number;
    total_score?: number; // Total score for the exam schedule
    assistant_grading?: boolean; // Enable AI assistant grading
}
