import { Elysia } from "elysia";
import { ExamSubmissionController } from "../controllers/exam-submission.controller";
import { 
    ExamSubmissionSchema, 
    GradeSubmissionSchema, 
    CheckAttemptEligibilitySchema,
    ManualGradeQuestionSchema 
} from "./schema/exam-submission.schema";

const controller = new ExamSubmissionController();

export const examSubmissionRoute = new Elysia({ prefix: '/submission' })
    // Submit an exam
    .post('/', async ({ body }) => {
        return await controller.submitExam(body);
    }, {
        body: ExamSubmissionSchema,
        detail: {
            tags: ['Exam Submission'],
            summary: 'Submit an exam',
            description: 'Submit student answers for an exam schedule'
        }
    })

    // Get a specific submission by ID
    .get('/:id', async ({ params }) => {
        return await controller.getSubmission(params.id);
    }, {
        detail: {
            tags: ['Exam Submission'],
            summary: 'Get submission by ID',
            description: 'Retrieve a specific exam submission by its ID'
        }
    })

    // Get all submissions for a student
    .get('/student/:studentId', async ({ params }) => {
        return await controller.getStudentSubmissions(params.studentId);
    }, {
        detail: {
            tags: ['Exam Submission'],
            summary: 'Get student submissions',
            description: 'Retrieve all submissions for a specific student'
        }
    })

    // Get all submissions for a schedule
    .get('/schedule/:scheduleId', async ({ params }) => {
        return await controller.getScheduleSubmissions(params.scheduleId);
    }, {
        detail: {
            tags: ['Exam Submission'],
            summary: 'Get schedule submissions',
            description: 'Retrieve all submissions for a specific exam schedule'
        }
    })

    // Get attempt count for a student on a specific schedule
    .get('/attempts/:scheduleId/:studentId', async ({ params }) => {
        return await controller.getStudentAttemptCount(params.scheduleId, params.studentId);
    }, {
        detail: {
            tags: ['Exam Submission'],
            summary: 'Get student attempt count',
            description: 'Get the number of attempts a student has made on a specific exam schedule'
        }
    })

    // Check if student can attempt exam
    .post('/can-attempt', async ({ body }) => {
        return await controller.canStudentAttemptExam(
            body.schedule_id, 
            body.student_id, 
            body.allowed_attempts
        );
    }, {
        body: CheckAttemptEligibilitySchema,
        detail: {
            tags: ['Exam Submission'],
            summary: 'Check attempt eligibility',
            description: 'Check if a student can attempt an exam based on allowed attempts'
        }
    })

    // Grade a submission (auto-grade MC/TF, manual grade essays)
    .post('/grade', async ({ body }) => {
        return await controller.gradeSubmission(body.submission_id, body.graded_by);
    }, {
        body: GradeSubmissionSchema,
        detail: {
            tags: ['Exam Submission'],
            summary: 'Grade submission',
            description: 'Grade an exam submission (auto-grade MC/TF questions, manual grade essays)'
        }
    })

    // Manually grade a specific question (for essay questions)
    .post('/grade-question', async ({ body }) => {
        return await controller.manualGradeQuestion(
            body.submission_id,
            body.question_id,
            body.score_obtained,
            body.is_correct,
            body.graded_by
        );
    }, {
        body: ManualGradeQuestionSchema,
        detail: {
            tags: ['Exam Submission'],
            summary: 'Manually grade question',
            description: 'Manually grade a specific question (typically essay questions)'
        }
    });
