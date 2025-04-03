import Elysia, { t } from "elysia";
import { EnrollmentController } from "../controllers/enrollment.controller";
import { tokenVerifier } from "../middleware/token-verify.middleware";

export const EnrollmentRoute = new Elysia({ prefix: '/enrollment' })
    .derive(() => { 
        return { controller: new EnrollmentController() } 
    })
    .use(tokenVerifier)
    .group('', (app) => 
        app
            // Enroll a student in a course group
            .post('/:courseId/group/:groupName/student/:studentId', async ({ params, controller }) => {
                return await controller.enrollStudent(params.courseId, params.groupName, params.studentId);
            }, {
                params: t.Object({
                    courseId: t.String(),
                    groupName: t.String(),
                    studentId: t.String()
                })
            })
            
            // Unenroll a student from a course group
            .delete('/:courseId/group/:groupName/student/:studentId', async ({ params, controller }) => {
                return await controller.unenrollStudent(params.courseId, params.groupName, params.studentId);
            }, {
                params: t.Object({
                    courseId: t.String(),
                    groupName: t.String(),
                    studentId: t.String()
                })
            })
            
            // Get all enrollments for a student
            .get('/student/:studentId', async ({ params, controller }) => {
                return await controller.getStudentEnrollments(params.studentId);
            }, {
                params: t.Object({
                    studentId: t.String()
                })
            })
            
            // Get all students enrolled in a group
            .get('/:courseId/group/:groupName', async ({ params, controller }) => {
                return await controller.getGroupEnrollments(params.courseId, params.groupName);
            }, {
                params: t.Object({
                    courseId: t.String(),
                    groupName: t.String()
                })
            })
    )
