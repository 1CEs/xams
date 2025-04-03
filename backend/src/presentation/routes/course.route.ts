import Elysia, { t } from "elysia";
import { CourseController } from "../controllers/course.controller";
import { tokenVerifier } from "../middleware/token-verify.middleware";
import { IInstructor } from "../../core/user/model/interface/iintructor";
import { AddCourseSchema, AddGroupSchema, updateCourseSchema } from "./schema/course.schema";

export const CourseRoute = new Elysia({ prefix: '/course' })
    .derive(() => { 
        return { controller : new CourseController() } 
    })
    .use(tokenVerifier)
    .group('', (app) => 
        app
            // Course-Only routes
            .get('', async ({ query, controller }) => await controller.getCourses(query.search), {
                query: t.Optional(t.Object({
                    search: t.Optional(t.String())
                }))
            })
            .get('/:id', async ({ params, controller }) => await controller.getCourseById(params.id))
            // .get('', async ({ query, controller }) => await controller.getCourseByInstructorId(query.instructor_id), {
            //     query: t.Object({
            //         instructor_id: t.String()
            //     })
            // })
            .post('', async ({ body, user, controller }) => await controller.addCourse({ ...body, instructor_id: user._id as unknown as string }, user as IInstructor), {
                body: AddCourseSchema
            })
            .patch('/:id', async ({ params, body, controller }) => await controller.updateCourse(params.id, body), {
                body: updateCourseSchema
            })
            .delete('/:id', async ({ params, controller }) => await controller.deleteCourse(params.id))
            // Group routes
            .post('/:id/group', async ({ params, body, controller }) => {
                // Ensure required fields are present and convert date strings to Date objects
                const groupData = {
                    ...body,
                    students: body.students || [],
                    exam_setting: (body.exam_setting || []).map((setting: any) => ({
                        ...setting,
                        open_time: new Date(setting.open_time),
                        close_time: new Date(setting.close_time)
                    }))
                };
                return await controller.addGroup(params.id, groupData);
            }, {
                body: AddGroupSchema
            })
            .delete('/:id/group/:groupName', async ({ params, controller }) => {
                return await controller.deleteGroup(params.id, params.groupName);
            })
    )
