import { t } from "elysia"

export const AddExaminationSchema = t.Object({
    title: t.String({ description: 'Title is required' }),
    description: t.String({ description: 'Description is required' }),
})

export const updateExaminationSchema = t.Object({
    title: t.Optional(t.String()),
    description: t.Optional(t.String()),
})