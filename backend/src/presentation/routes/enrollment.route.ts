import Elysia, { t } from "elysia";
import { EnrollmentController } from "../controllers/enrollment.controller";
import { tokenVerifier } from "../middleware/token-verify.middleware";
import { catchAsync } from "../../utils/error";
import { Context } from "elysia";

type EnrollmentContext = Context & {
    controller: EnrollmentController;
}

export const EnrollmentRoute = new Elysia({ prefix: '/enrollment' })
    .derive(() => { 
        return { controller: new EnrollmentController() } 
    })
    .use(tokenVerifier)
    .group('', (app) => 
        app
            // Enroll a student in a course group
            .post('/:courseId/group/:groupName/student/:studentId', catchAsync(async ({ params, controller }: EnrollmentContext & { params: { courseId: string, groupName: string, studentId: string } }) => {
                return await controller.enrollStudent(params.courseId, params.groupName, params.studentId);
            }), {
                params: t.Object({
                    courseId: t.String(),
                    groupName: t.String(),
                    studentId: t.String()
                })
            })
            
            // Unenroll a student from a course group
            .delete('/:courseId/group/:groupName/student/:studentId', catchAsync(async ({ params, controller }: EnrollmentContext & { params: { courseId: string, groupName: string, studentId: string } }) => {
                return await controller.unenrollStudent(params.courseId, params.groupName, params.studentId);
            }), {
                params: t.Object({
                    courseId: t.String(),
                    groupName: t.String(),
                    studentId: t.String()
                })
            })
            
            // Get all enrollments for a student
            .get('/student/:studentId', catchAsync(async ({ params, controller }: EnrollmentContext & { params: { studentId: string } }) => {
                return await controller.getStudentEnrollments(params.studentId);
            }), {
                params: t.Object({
                    studentId: t.String()
                })
            })
            
            // Get all students enrolled in a group
            .get('/:courseId/group/:groupName', catchAsync(async ({ params, controller }: EnrollmentContext & { params: { courseId: string, groupName: string } }) => {
                return await controller.getGroupEnrollments(params.courseId, params.groupName);
            }), {
                params: t.Object({
                    courseId: t.String(),
                    groupName: t.String()
                })
            })
    )
