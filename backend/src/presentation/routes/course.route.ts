import Elysia, { t } from "elysia";
import { CourseController } from "../controllers/course.controller";
import { tokenVerifier } from "../middleware/token-verify.middleware";
import { IInstructor } from "../../core/user/model/interface/iintructor";
import { AddCourseSchema, AddGroupSchema, ExamSettingSchema, updateCourseSchema } from "./schema/course.schema";

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
            // Exam setting routes
            .post('/:id/group/:groupName/exam-setting', async ({ params, body, controller }) => {
                // Convert date strings to Date objects and ensure all required fields are present
                const examSetting = {
                    exam_id: body.exam_id,
                    open_time: new Date(body.open_time),
                    close_time: new Date(body.close_time),
                    ip_range: body.ip_range || '',
                    exam_code: body.exam_code || '',
                    allowed_attempts: body.allowed_attempts,
                    allowed_review: body.allowed_review,
                    show_answer: body.show_answer,
                    randomize_question: body.randomize_question,
                    randomize_choice: body.randomize_choice
                };
                return await controller.addGroupExamSetting(params.id, params.groupName, examSetting);
            }, {
                body: ExamSettingSchema
            })
            .delete('/:id/group/:groupName/exam-setting/:examSettingIndex', async ({ params, controller }) => {
                // Parse the index parameter as a number
                const index = parseInt(params.examSettingIndex, 10);
                if (isNaN(index)) {
                    return {
                        message: 'Invalid exam setting index',
                        code: 400,
                        data: null
                    };
                }
                return await controller.deleteGroupExamSetting(params.id, params.groupName, index);
            })
    )
