import { t } from "elysia";
import { urlRegex } from "../../../utils/regex";

export const AddCourseSchema = t.Object({
    course_name: t.String({ description: 'Title is required' }),
    background_src: t.String({ pattern: urlRegex, description: 'Profile URL is required' }),
    description: t.String({ description: 'Description is required' }),
})

export const updateCourseSchema = t.Object({
    course_name: t.String({ description: 'Title is required' }),
    background_src: t.String({ pattern: urlRegex, description: 'Profile URL is required' }),
    description: t.String({ description: 'Description is required' }),
})

export const AddGroupSchema = t.Object({
    group_name: t.String({ description: 'Group name is required' }),
    join_code: t.String({ description: 'Join code is required' }),
    students: t.Optional(t.Array(t.String())),
    exam_setting: t.Optional(t.Array(t.Object({
        exam_id: t.String(),
        open_time: t.String(),
        close_time: t.String(),
        ip_range: t.Optional(t.String()),
        exam_code: t.Optional(t.String()),
        allowed_attempts: t.Optional(t.Number()),
        allowed_review: t.Optional(t.Boolean()),
        show_answer: t.Optional(t.Boolean()),
        randomize_question: t.Optional(t.Boolean()),
        randomize_choice: t.Optional(t.Boolean())
    })))
})
