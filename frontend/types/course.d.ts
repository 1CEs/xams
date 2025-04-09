type CourseResponse = {
    _id: string
    instructor_id: string
    background_src: string
    course_name: string
    description: string
    groups: IGroup[]
}

type IGroup = {
    _id: string
    group_name: string
    join_code: string
    students: string[]
    exam_setting: ISetting[]
}

type ISetting = {
    _id: string
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