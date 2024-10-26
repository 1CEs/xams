import jwt from "@elysiajs/jwt";
import Elysia from "elysia";
import { jwtOption } from "../../constants/options";
import { errorResponse } from "../../utils/error";
import { UserServiceFactory } from "../../core/user/service/user.service";
import { UserRepoFactory } from "../../core/user/repository/user-repo";

export const verifyToken = (app: Elysia) => app
        .use(jwt(jwtOption))
        .derive(async({jwt, cookie: { accessToken }, error}) => {
            if(!accessToken.value) return error(401, errorResponse('Access token is missing.'))
            
            const jwtPayload = await jwt.verify(accessToken.value)

            if(!jwtPayload) return error(403, errorResponse('Access token is invalid.'))
            
            const username = jwtPayload.sub
            
            const factory = new UserServiceFactory(new UserRepoFactory)
            const service = {
                instructor: factory.createService('instructor'),
                student: factory.createService('student'),
            }

            const instructor = await service.instructor.findByIdentifierService(username!)
            const student = await service.student.findByIdentifierService(username!)

            const user = student || instructor

            if(!user) return error(403, errorResponse('Access token is invalid.'))
            
            return { user }
        })