import Elysia, { error } from "elysia";
import { verifyToken } from "../plugins/auth.plugin";
import { CategoryBodySchema } from "../schema/category.schema";
import { UserRepoFactory } from "../../core/user/repository/user-repo";
import { InstructorService } from "../../core/user/service/instructor.service";
import { UserServiceFactory } from "../../core/user/service/user.service";
import { UserType } from "../../types/user";
import { errorResponse } from "../../utils/error";
import { IInstructor } from "../../models/interface/user/instructor";

export const CategoryController = new Elysia({ prefix: 'category' })
    .use(verifyToken)
    .get('', ({ user }) => {
        return (user as IInstructor).my_category
    })
    .use(verifyToken)
    .patch('', ({ body }) => body, {
        body: CategoryBodySchema,
        afterHandle: ({ body, user }) => {
            try {
                const userService = new UserServiceFactory(new UserRepoFactory).createService(user.role as UserType)
                const update = (userService as InstructorService).updateCategoryService(String(user._id), body.name, body.color)
                return update
            } catch (err) {
                return error(500, errorResponse(err as string))
            }
        }
    })