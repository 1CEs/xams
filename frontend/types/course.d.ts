type CourseResponse = {
    _id: string
    instructor_id: string
    background_src: string
    course_name: string
    description: string
    category: string
    groups: IGroup[]
}

type IGroup = {
    _id: string
    group_name: string
    join_code: string
    students: string[]
    schedule_ids: string[]
}
