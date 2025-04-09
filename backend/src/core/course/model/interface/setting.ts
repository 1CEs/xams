export interface ISetting {
    _id?: string
    exam_id: string
    open_time: Date
    close_time: Date
    ip_range: string
    exam_code: string
    allowed_attempts: number
    allowed_review: boolean
    show_answer: boolean
    randomize_question: boolean
    randomize_choice: boolean
}