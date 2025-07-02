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
    schedule_id: string
}
