import { t } from "elysia";
import { urlRegex } from "../../../utils/regex";

export const AddCourseSchema = t.Object({
    course_name: t.String({ description: 'Title is required' }),
    background_src: t.String({ pattern: urlRegex, description: 'Profile URL is required' }),
    description: t.Optional(t.String()),
    category: t.Union([
        t.Literal('general'),
        t.Literal('mathematics'),
        t.Literal('science'),
        t.Literal('computer_science'),
        t.Literal('languages'),
        t.Literal('social_studies'),
        t.Literal('arts'),
        t.Literal('business'),
        t.Literal('health'),
        t.Literal('engineering')
    ], { description: 'Course category is required' })
})

export const updateCourseSchema = t.Object({
    course_name: t.String({ description: 'Title is required' }),
    background_src: t.String({ pattern: urlRegex, description: 'Profile URL is required' }),
    description: t.Optional(t.String()),
    category: t.Optional(t.Union([
        t.Literal('general'),
        t.Literal('mathematics'),
        t.Literal('science'),
        t.Literal('computer_science'),
        t.Literal('languages'),
        t.Literal('social_studies'),
        t.Literal('arts'),
        t.Literal('business'),
        t.Literal('health'),
        t.Literal('engineering')
    ])),
})

export const AddGroupSchema = t.Object({
    group_name: t.String({ description: 'Group name is required' }),
    join_code: t.String({ description: 'Join code is required' }),
    students: t.Optional(t.Array(t.String())),
    schedule_ids: t.Optional(t.Array(t.String()))
})

export const ExamSettingSchema = t.Object({
    exam_ids: t.Array(t.String(), { description: 'Examination IDs are required' }),
    schedule_name: t.String({ description: 'Schedule name is required' }),
    open_time: t.Optional(t.String({ description: 'Open time (optional for immediate access)' })),
    close_time: t.Optional(t.String({ description: 'Close time (optional for unlimited access)' })),
    ip_range: t.Optional(t.String()),
    exam_code: t.Optional(t.String({ description: 'Exam access code (optional for open access)' })),
    allowed_attempts: t.Number({ description: 'Allowed attempts is required' }),
    allowed_review: t.Boolean({ description: 'Allowed review is required' }),
    show_answer: t.Boolean({ description: 'Show answer is required' }),
    randomize_question: t.Boolean({ description: 'Randomize question is required' }),
    randomize_choice: t.Boolean({ description: 'Randomize choice is required' }),
    question_count: t.Number({ description: 'Number of questions to include is required' }),
    total_score: t.Optional(t.Number({ description: 'Total score for the exam schedule (optional, calculated from questions)' })),
    selected_questions: t.Optional(t.Array(t.Any(), { description: 'Selected questions from frontend (optional)' }))
})
