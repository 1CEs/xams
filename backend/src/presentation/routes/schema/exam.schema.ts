import { t } from "elysia"

export const AddExaminationSchema = t.Object({
    title: t.String({ description: 'Title is required' }),
    description: t.String({ description: 'Description is required' }),
    category: t.Array(t.String({ description: 'Category is required', default: []})),
})

export const QuestionFormSchema = t.Object({
    question: t.String({ description: 'Question is required' }),
    type: t.Union([
        t.Literal('tf'),
        t.Literal('les'),
        t.Literal('mc'),
        t.Literal('ses')
    ], { description: 'Question type is required' }),
    choices: t.Array(t.String({ description: 'Choices are required' })),
    answer: t.Array(t.String({ description: 'Answer is required' }), { min: 1, max: 4 }),
    score: t.Number({ description: 'Score is required' })
})

export const updateExaminationSchema = t.Object({
    title: t.Optional(t.String()),
    description: t.Optional(t.String()),
    questions: t.Optional(t.Array(QuestionFormSchema)),
    category: t.Array(t.String({ description: 'Category is required' })),
})

