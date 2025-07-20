import { t } from "elysia";

export const SubmittedAnswerSchema = t.Object({
    question_id: t.String({ description: 'Question ID is required' }),
    submitted_question: t.String({ description: 'Question text is required' }),
    question_type: t.Union([
        t.Literal('mc'),
        t.Literal('tf'),
        t.Literal('ses'),
        t.Literal('les'),
        t.Literal('nested')
    ], { description: 'Question type is required' }),
    submitted_choices: t.Optional(t.Array(t.String(), { description: 'Selected choices for multiple choice questions' })),
    submitted_answer: t.Optional(t.String({ description: 'Text answer for essay questions' })),
    submitted_boolean: t.Optional(t.Boolean({ description: 'Boolean answer for true/false questions' })),
    max_score: t.Number({ description: 'Maximum score for this question is required' })
});

export const ExamSubmissionSchema = t.Object({
    schedule_id: t.String({ description: 'Schedule ID is required' }),
    student_id: t.String({ description: 'Student ID is required' }),
    course_id: t.String({ description: 'Course ID is required' }),
    group_id: t.String({ description: 'Group ID is required' }),
    submitted_answers: t.Array(SubmittedAnswerSchema, { description: 'Submitted answers are required' }),
    time_taken: t.Optional(t.Number({ description: 'Time taken in seconds' }))
});

export const GradeSubmissionSchema = t.Object({
    submission_id: t.String({ description: 'Submission ID is required' }),
    graded_by: t.String({ description: 'Grader ID is required' })
});

export const CheckAttemptEligibilitySchema = t.Object({
    schedule_id: t.String({ description: 'Schedule ID is required' }),
    student_id: t.String({ description: 'Student ID is required' }),
    allowed_attempts: t.Number({ description: 'Allowed attempts is required' })
});
