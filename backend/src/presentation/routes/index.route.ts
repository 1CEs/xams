import Elysia from "elysia"
import { AuthRoute } from "./auth.route"
import { UserRoute } from "./user.route"
import { ExamRoute } from "./exam.route"
import { UploadRoute } from "./upload.route"
import { CourseRoute } from "./course.route"
import { EnrollmentRoute } from "./enrollment.route"

export const indexRouter = new Elysia({ prefix: '/api' })
    .use(AuthRoute)
    .use(UserRoute)
    .use(ExamRoute)
    .use(CourseRoute)
    .use(UploadRoute)
    .use(EnrollmentRoute)
