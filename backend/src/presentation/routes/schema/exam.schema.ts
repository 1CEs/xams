import { t } from "elysia"

export const AddExaminationSchema = t.Object({
    title: t.String({ description: 'Title is required' }),
    description: t.String({ description: 'Description is required' }),
    category: t.Optional(t.Array(t.String())),
})

export const QuestionFormSchema = t.Object({
    question: t.String({ description: 'Question is required' }),
    type: t.Union([
        t.Literal('tf'),
        t.Literal('les'),
        t.Literal('mc'),
        t.Literal('ses')
    ], { description: 'Question type is required' }),
    choices: t.Optional(t.Array(t.Object({
        content: t.String(),
        isCorrect: t.Boolean()
    }))),
    isTrue: t.Optional(t.Boolean()),
    expectedAnswer: t.Optional(t.String()),
    maxWords: t.Optional(t.Number()),
    score: t.Number({ description: 'Score is required' })
})

export const NestedQuestionSchema = t.Object({
    question: t.String({ description: 'Question is required' }),
    type: t.Literal('nested'),
    score: t.Number({ description: 'Score is required' }),
    questions: t.Array(QuestionFormSchema)
})

export const updateExaminationSchema = t.Object({
    title: t.Optional(t.String()),
    description: t.Optional(t.String()),
    questions: t.Optional(t.Array(QuestionFormSchema)),
    category: t.Array(t.String({ description: 'Category is required' })),
})

