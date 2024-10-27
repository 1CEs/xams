import Elysia, { t } from "elysia"
import { SignUpBody, SignInBody, UserType } from "../../types/user"
import { UserServiceFactory } from "../../core/user/service/user.service"
import { UserRepoFactory } from "../../core/user/repository/user-repo"
import { SignInSchema, SignUpSchema } from "../schema/auth.schema"
import jwt from "@elysiajs/jwt"
import { assignTokensToCookies } from "../../utils/jwt-cookies"
import { errorResponse } from "../../utils/error"
import { jwtOption } from "../../constants/options"
import { verifyToken } from "../plugins/auth.plugin"

export const AuthController = new Elysia({ prefix: '/auth' })
    .use(jwt(jwtOption))
    .post('/sign-up', ({ body }: { body: SignUpBody }) => body, {
        body: SignUpSchema,
        afterHandle: async ({ body, jwt, cookie: { accessToken, refreshToken }, set, error }) => {
            try {
                const studentService = new UserServiceFactory(new UserRepoFactory).createService('student')
                const instructorService = new UserServiceFactory(new UserRepoFactory).createService('instructor')
                const studentExists = await studentService.findByIdentifierService(body.username) || await studentService.findByIdentifierService(body.email)
                const instructorExists = await instructorService.findByIdentifierService(body.username) || await instructorService.findByIdentifierService(body.email)

                if (studentExists || instructorExists) {
                    console.log(studentExists)
                    console.log(instructorExists)
                    return error(409, errorResponse('Username or email already exists.'))
                }

                const userService = new UserServiceFactory(new UserRepoFactory).createService(body.role as UserType)
                const password = await Bun.password.hash(body.password, {
                    algorithm: 'bcrypt',
                    cost: 16
                })

                const { accToken, refToken } = await assignTokensToCookies<typeof jwt>(body.username, jwt, accessToken, refreshToken)

                const user = await userService.saveService({ ...body, password, refresh_token: refToken })

                set.status = 'Created'
                return {
                    message: 'Sign un successfully.',
                    credentials: {
                        _id: user._id,
                        username: user.username,
                        email: user.email,
                        role: user.role,
                        refresh_token: refToken,
                        access_token: accToken
                    }
                }
            } catch (err) {
                return error(500, { err: { message: err } })
            }
        }
    })
    .post('/sign-in', ({ body }: { body: SignInBody }) => body, {
        body: SignInSchema,
        afterHandle: async ({ body, jwt, cookie: { accessToken, refreshToken }, set, error }) => {
            try {
                const factory = new UserServiceFactory(new UserRepoFactory)
                const service = {
                    instructor: factory.createService('instructor'),
                    student: factory.createService('student'),
                }
                const student = await service.student.findByIdentifierService(body.identifier)
                const instructor = await service.instructor.findByIdentifierService(body.identifier)
                const matchService = student ? student : instructor ? instructor : null

                if (!matchService) return error(404, errorResponse('User not found.'))

                const isPasswordMatch = await Bun.password.verify(body.password, matchService.password, 'bcrypt')

                if (!isPasswordMatch) return error(401, errorResponse('Incorrect password.'))

                const { accToken, refToken } = await assignTokensToCookies<typeof jwt>(matchService.username, jwt, accessToken, refreshToken)

                return {
                    message: 'Sign in successfully.',
                    credentials: {
                        _id: matchService._id,
                        username: matchService.username,
                        email: matchService.email,
                        role: matchService.role,
                        refresh_token: refToken,
                        access_token: accToken
                    }
                }
            } catch (err) {
                return error(500, 'Err: ' + err)
            }
        }
    })
    .use(verifyToken)
    .post('/logout', ({ cookie: { accessToken, refreshToken }, user }) => {
        accessToken.remove
        refreshToken.remove
        user.updateOne({ refresh_token: null })
        return { message: 'Logout successfully' }
    })
    .use(verifyToken)
    .get('/me', ({ user }) => user)
    .post('/refresh', async ({ cookie: { accessToken, refreshToken }, jwt, error }) => {
        if (!refreshToken.value) return error(401, errorResponse('Access token is missing.'))

        const jwtPayload = await jwt.verify(refreshToken.value)

        if (!jwtPayload) return error(403, errorResponse('Access token is invalid.'))

        const username = jwtPayload.sub

        const factory = new UserServiceFactory(new UserRepoFactory)
        const service = {
            instructor: factory.createService('instructor'),
            student: factory.createService('student'),
        }

        const instructor = await service.instructor.findByIdentifierService(username!)
        const student = await service.student.findByIdentifierService(username!)

        const user = student || instructor

        if (!user) return error(403, errorResponse('Access token is invalid.'))

        const { accToken, refToken } = await assignTokensToCookies<typeof jwt>(user.username, jwt, accessToken, refreshToken)

        user.updateOne({ refresh_token: refToken })
        
        return {
            message: "Access token generated successfully",
            data: {
                accessToken: accToken,
                refreshToken: refToken,
            },
        }
    })