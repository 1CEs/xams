import { t } from "elysia";

export const ExamBodySchema = t.Object({
    title: t.String({ maxLength: 1000 }),
    description: t.String({ default: 'N/A'})
})