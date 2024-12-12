import Elysia, { t } from "elysia";
import { CourseController } from "../controllers/course.controller";
import { tokenVerifier } from "../middleware/token-verify.middleware";
import { IInstructor } from "../../core/user/model/interface/iintructor";
import { AddCourseSchema, updateCourseSchema } from "./schema/course.schema";

export const CourseRoute = new Elysia({ prefix: '/course' })
    .derive(() => { 
        return { controller : new CourseController() } 
    })
    .use(tokenVerifier)
    .group('', (app) => 
        app
            // Course-Only routes
            .get('', async ({ controller }) => await controller.getCourses())
            .get('/:id', async ({ params, controller }) => await controller.getCourseById(params.id))
            .get('', async ({ query, controller }) => await controller.getCourseByInstructorId(query.instructor_id), {
                query: t.Object({
                    instructor_id: t.String()
                })
            })
            .post('', async ({ body, user, controller }) => await controller.addCourse({ ...body, instructor_id: user._id as unknown as string }, user as IInstructor), {
                body: AddCourseSchema
            })
            .patch('/:id', async ({ params, body, controller }) => await controller.updateCourse(params.id, body), {
                body: updateCourseSchema
            })
            .delete('/:id', async ({ params, controller }) => await controller.deleteCourse(params.id))
    )
