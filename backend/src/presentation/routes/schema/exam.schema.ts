import { t } from "elysia"

export const AddExaminationSchema = t.Object({
    instructor_id: t.String({ description: 'Instructor id is required'}),
    title: t.String({ description: 'Title is required' }),
    description: t.String({ description: 'Description is required' }),
    questions: t.Null()
})

export const updateExaminationSchema = t.Object({
    title: t.Optional(t.String()),
    description: t.Optional(t.String()),
})