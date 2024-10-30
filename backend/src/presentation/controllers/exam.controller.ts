import Elysia from "elysia";
import { verifyToken } from "../plugins/auth.plugin";
import { ExamBodySchema } from "../schema/exam.schema";
import { ExamService } from "../../core/examination/exam.service";
import { errorResponse } from "../../utils/error";
import { UserRepoFactory } from "../../core/user/repository/user-repo";
import { UserServiceFactory } from "../../core/user/service/user.service";
import { UserType } from "../../types/user";
import { InstructorService } from "../../core/user/service/instructor.service";
import { ObjectId } from "mongoose";

export const ExamController = new Elysia({ prefix: 'exam' })
    .use(verifyToken)
    .get('', async ({ user, error }) => {
        try {
            const service = new ExamService()
            const exam = await service.findByInstructorService(user._id)
            return exam
        } catch (err) {
            return error(500, errorResponse(err as string))
        }

    })
    .get('/:id', async ({ params, error }) => {
        try {
            const id = params.id
            const service = new ExamService()
            const exam = await service.findByIdService(id as unknown as ObjectId)
            return { exam }
        } catch (err) {
            return error(500, errorResponse(err as string))
        }

    })
    .use(verifyToken)
    .post('', ({ body }) => body, {
        body: ExamBodySchema,
        afterHandle: async ({ body, user, error }) => {
            try {
                const service = new ExamService()
                const exam = await service.saveService({ ...body, instructor_id: String(user._id) })
                const userService = new UserServiceFactory(new UserRepoFactory).createService(user.role as UserType)
                const update = (userService as InstructorService).updateBankService(String(user._id), String(exam._id))
                return update
            } catch (err) {
                return error(500, errorResponse(err as string))
            }
        }
    })