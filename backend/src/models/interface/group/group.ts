import { ObjectId, Date } from "mongoose";

export interface IGroup {
    _id:            ObjectId
    course:         ObjectId
    name:           string
    join_code:      string
    students:       ObjectId[]
    exam_settings: {
        exam_id:            ObjectId
        open_time:          Date
        close_time:         Date
        allow_attempts:     number
        allow_review:       boolean
        randomize_q:        boolean
        randomize_a:        boolean
        show_solution:      boolean
    }[]
}