import { t } from "elysia"

export const AddExaminationSchema = t.Object({
    title: t.String({ description: 'Title is required' }),
    description: t.String({ description: 'Description is required' }),
    // Bank context parameters
    bankId: t.Optional(t.String({ description: 'ID of the bank to associate this exam with' })),
    subBankPath: t.Optional(t.Array(t.String(), { description: 'Path of sub-bank IDs to locate the target sub-bank' })),
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
        isCorrect: t.Boolean(),
        score: t.Number()
    }))),
    isRandomChoices: t.Optional(t.Boolean()),
    isTrue: t.Optional(t.Boolean()),
    expectedAnswers: t.Optional(t.Array(t.String())),
    maxWords: t.Optional(t.Number()),
    score: t.Number({ description: 'Score is required' })
})

export const NestedQuestionSchema = t.Object({
    question: t.String({ description: 'Question is required' }),
    type: t.Literal('nested'),
    score: t.Number({ description: 'Score is required' }),
    questions: t.Array(QuestionFormSchema)
})

export const NestedQuestionFromExistingSchema = t.Object({
    nestedQuestionData: t.Object({
        question: t.String({ description: 'Nested question title is required' }),
        score: t.Number({ description: 'Score is required' })
    }),
    questionIds: t.Array(t.String(), { description: 'Question IDs are required' })
})

export const updateExaminationSchema = t.Object({
    title: t.Optional(t.String()),
    description: t.Optional(t.String()),
    questions: t.Optional(t.Array(QuestionFormSchema)),
})
