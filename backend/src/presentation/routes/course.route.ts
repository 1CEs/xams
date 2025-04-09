import Elysia, { t } from "elysia";
import { CourseController } from "../controllers/course.controller";
import { tokenVerifier } from "../middleware/token-verify.middleware";
import { IInstructor } from "../../core/user/model/interface/iintructor";
import { AddCourseSchema, AddGroupSchema, ExamSettingSchema, updateCourseSchema } from "./schema/course.schema";
import { catchAsync } from "../../utils/error";
import { Static } from "@sinclair/typebox";
import { Context } from "elysia";

type CourseContext = Context & {
    controller: CourseController;
    user: IInstructor;
}

type AddCourseBody = Static<typeof AddCourseSchema>
type AddGroupBody = Static<typeof AddGroupSchema>
type ExamSettingBody = Static<typeof ExamSettingSchema>
type UpdateCourseBody = Static<typeof updateCourseSchema>

export const CourseRoute = new Elysia({ prefix: '/course' })
    .derive(() => {
        return { controller: new CourseController() }
    })
    .get('', catchAsync(async ({ query, controller }: CourseContext & { query: { search?: string } }) => await controller.getCourses(query.search)), {
        query: t.Optional(t.Object({
            search: t.Optional(t.String())
        }))
    })
    .use(tokenVerifier)
    .group('', (app) =>
        app
            // Course-Only routes
            .get('/:id', catchAsync(async ({ params, controller }: CourseContext & { params: { id: string } }) => await controller.getCourseById(params.id)))
            // .get('', async ({ query, controller }) => await controller.getCourseByInstructorId(query.instructor_id), {
            //     query: t.Object({
            //         instructor_id: t.String()
            //     })
            // })

            .post('', catchAsync(async ({ body, user, controller }: CourseContext & { body: AddCourseBody }) => await controller.addCourse({ ...body, instructor_id: user._id as unknown as string }, user)), {
                body: AddCourseSchema
            })
            .post('/verify', catchAsync(async ({ query, controller, user }: CourseContext & { query: { course_id: string, group_id: string, setting_id: string, password: string } }) => await controller.verifyPassword(query.course_id, query.group_id, query.setting_id, query.password, user)), {
                query: t.Object({
                    course_id: t.String(),
                    setting_id: t.String(),
                    group_id: t.String(),
                    password: t.String()
                })
            })
            .patch('/:id', catchAsync(async ({ params, body, controller }: CourseContext & { params: { id: string }, body: UpdateCourseBody }) => await controller.updateCourse(params.id, body)), {
                body: updateCourseSchema
            })
            .delete('/:id', catchAsync(async ({ params, controller }: CourseContext & { params: { id: string } }) => await controller.deleteCourse(params.id)))
            // Group routes
            .post('/:id/group', catchAsync(async ({ params, body, controller }: CourseContext & { params: { id: string }, body: AddGroupBody }) => {
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
            }), {
                body: AddGroupSchema
            })
            .delete('/:id/group/:groupName', catchAsync(async ({ params, controller }: CourseContext & { params: { id: string, groupName: string } }) => {
                return await controller.deleteGroup(params.id, params.groupName);
            }))
            // Exam setting routes
            .post('/:id/group/:groupName/exam-setting', catchAsync(async ({ params, body, controller }: CourseContext & { params: { id: string, groupName: string }, body: ExamSettingBody }) => {
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
            }), {
                body: ExamSettingSchema
            })
            .delete('/:id/group/:groupName/exam-setting/:examSettingIndex', catchAsync(async ({ params, controller }: CourseContext & { params: { id: string, groupName: string, examSettingIndex: string } }) => {
                // Parse the index parameter as a number
                const index = parseInt(params.examSettingIndex, 10);
                if (isNaN(index)) {
                    throw new Error('Invalid exam setting index');
                }
                return await controller.deleteGroupExamSetting(params.id, params.groupName, index);
            }))
            .get('', catchAsync(async ({ query, controller }: CourseContext & { query: { course_id: string, group_id: string, setting_id: string } }) => await controller.getSetting(query.course_id, query.group_id, query.setting_id)), {
                query: t.Object({
                    course_id: t.String(),
                    group_id: t.String(),
                    setting_id: t.String()
                })
            })
    )
