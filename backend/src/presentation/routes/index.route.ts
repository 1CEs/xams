import Elysia from "elysia"
import { AuthRoute } from "./auth.route"
import { UserRoute } from "./user.route"
import { ExamRoute } from "./exam.route"
import { ExamScheduleRoute } from "./exam-schedule.route"
import { UploadRoute } from "./upload.route"
import { CourseRoute } from "./course.route"
import { EnrollmentRoute } from "./enrollment.route"
import { errorPlugin } from "../../utils/error"
import { AssistantRoute } from "./assistant.route"
import { BankRoute } from "./bank.route"
import { examSubmissionRoute } from "./exam-submission.route"

export const indexRouter = new Elysia({ prefix: '/api' })
    .use(errorPlugin)
    .use(AuthRoute)
    .use(UserRoute)
    .use(ExamRoute)
    .use(ExamScheduleRoute)
    .use(CourseRoute)
    .use(UploadRoute)
    .use(EnrollmentRoute)
    .use(AssistantRoute)
    .use(BankRoute)
    .use(examSubmissionRoute)
