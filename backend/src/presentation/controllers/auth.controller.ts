import { IUser } from "../../core/user/model/interface/iuser"
import { IUserServiceFactory } from "../../core/user/service/interface/iuser.factory"
import { UserServiceFactory } from "../../core/user/service/user.factory"
import { SignInPayload, SignUpPayload } from "../../types/user"
import { emailRegex } from "../../utils/regex"
import { IAuthController } from "./interface/iauth.controller"
import { SetTokenParameters } from "../../types/auth"
import { IStudent } from "../../core/user/model/interface/istudent"
import { IInstructor } from "../../core/user/model/interface/iintructor"
import { 
    BadRequestError, 
    UnauthorizedError, 
    ConflictError, 
    NotFoundError,
    ValidationError 
} from "../../utils/error"

type JWTInstance = {
    sign: (payload: any) => Promise<string>
    verify: (token: string) => Promise<any>
}

export class AuthController implements IAuthController {
    private _factory: IUserServiceFactory
    constructor() {
        this._factory = new UserServiceFactory()
    }

    private _response<T>(message: string, code: number, data: T, success: boolean = true, errorType?: string): ControllerResponse<T> {
        return {
            message,
            code,
            data,
            success,
            errorType
        }
    }

    private _errorResponse(message: string, code: number, errorType: string, details?: any): ControllerResponse<null> {
        return {
            message,
            code,
            data: null,
            success: false,
            errorType,
            details
        }
    }

    async signup(payload: SignUpPayload) {
            // Validate required fields
            if (!payload.body?.username || !payload.body?.email || !payload.body?.password) {
                return this._errorResponse('Username, email, and password are required', 400, 'ValidationError')
            }

            // Validate email format
            if (!RegExp(emailRegex).test(payload.body.email)) {
                return this._errorResponse('Please provide a valid email address', 400, 'ValidationError')
            }

            // Validate password strength with detailed requirements
            const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
            if (!passwordRegex.test(payload.body.password)) {
                return this._errorResponse(
                    'Password must contain at least 8 characters with uppercase, lowercase, number, and special character (@$!%*?&)',
                    400,
                    'ValidationError'
                )
            }

            const instance = this._factory.createService(payload.body.role)
            
            try {
                const user = await instance.register(payload.body)
                
                if (!user) {
                    return this._errorResponse('Failed to create user account', 400, 'BadRequestError')
                }

                delete payload.body
                await this.setToken(String((user as unknown as IUser | IStudent | IInstructor)._id), { ...payload })

                return this._response('Account created successfully! Welcome to XAMS!', 201, user)
            } catch (error: any) {
                // Handle duplicate key errors (username/email already exists)
                if (error.message?.includes('E11000') || error.code === 11000) {
                    if (error.message?.includes('username')) {
                        console.log("Username")
                        // Return error response directly with proper status
                        return this._errorResponse('This username is already taken. Please choose a different one.', 400, 'ConflictError')
                    } else if (error.message?.includes('email')) {
                        console.log("Email")
                        return this._errorResponse('An account with this email already exists. Please use a different email or sign in.', 400, 'ConflictError')
                    } else {
                        console.log("Else")
                        return this._errorResponse('Username or email already exists. Please use different credentials.', 400, 'ConflictError')
                    }
                }
                throw error
            }
    }

    async signin(payload: SignInPayload) {
        try {
            // Validate required fields
            if (!payload.body?.identifier || !payload.body?.password) {
                return this._errorResponse('Username/email and password are required', 400, 'ValidationError')
            }

            const instance = this._factory.createService('general')
            const isEmail = RegExp(emailRegex).test(payload.body.identifier)

            let user: IUser | null
            try {
                if (isEmail) {
                    user = await instance.getUserByEmail(payload.body.identifier)
                } else {
                    user = await instance.getUserByUsername(payload.body.identifier)
                }
            } catch (error) {
                console.error('Database error during user lookup:', error)
                return this._errorResponse('Unable to process sign-in request. Please try again.', 400, 'BadRequestError')
            }

            if (!user) {
                const identifierType = isEmail ? 'email address' : 'username'
                return this._errorResponse(`No account found with this ${identifierType}. Please check your credentials or sign up for a new account.`, 400, 'UnauthorizedError')
            }

            let passwordIsValid: boolean
            try {
                passwordIsValid = await Bun.password.verify(payload.body.password, user.password, "bcrypt")
            } catch (error) {
                console.error('Password verification error:', error)
                return this._errorResponse('Unable to verify password. Please try again.', 400, 'BadRequestError')
            }

            if (!passwordIsValid) {
                return this._errorResponse('Incorrect password. Please check your password and try again.', 400, 'UnauthorizedError')
            }

            // Check if user is banned - return user data with banned status instead of throwing error
            if (user.status?.is_banned) {
                // Check if temporary ban has expired
                if (user.status.ban_until && new Date(user.status.ban_until) <= new Date()) {
                    // Automatically unban expired users
                    const instance = this._factory.createService('general')
                    await instance.updateUser(String(user._id), {
                        status: {
                            is_banned: false,
                            ban_until: undefined,
                            ban_reason: undefined
                        }
                    })
                    // Continue with normal flow since ban has expired
                } else {
                    // User is still banned - return user data with banned status for frontend to handle
                    delete payload.body
                    await this.setToken(String(user._id), { ...payload })
                    return this._response<typeof user>(`Account is banned`, 200, user)
                }
            }

            
            delete payload.body
            await this.setToken(String(user._id), { ...payload })
            return this._response<typeof user>(`Welcome back, ${user.username}! Sign-in successful.`, 200, user)
        } catch (error: any) {
            console.error('Signin error:', error)
            return this._errorResponse('Signin error', 400, 'SigninError')
        }
    } 

    me(user: IUser) {
        if (!user) {
            return this._errorResponse('User session not found. Please sign in again.', 400, 'UnauthorizedError')
        }
        return this._response<typeof user>(`Hello ${user.username}`, 200, user)
    }

    logout({ accessToken, refreshToken }: Omit<SetTokenParameters, 'jwt'>) {
        try {
            accessToken.remove()
            refreshToken.remove()
            return this._response<null>('You have been signed out successfully. See you next time!', 200, null)
        } catch (error) {
            console.error('Logout error:', error)
            return this._errorResponse('Unable to complete sign out. Please try again.', 400, 'BadRequestError')
        }
    }

    async setToken(id: string, { jwt, accessToken, refreshToken }: SetTokenParameters) {
        // For JWT, exp should be in seconds since epoch, not duration in seconds
        const accessTokenExp = Number(process.env.ACCESS_TOKEN_EXP! || 84600); // Default 24 hours in seconds
        const refreshTokenExp = Number(process.env.REFRESH_TOKEN_EXP! || 604800); // Default 7 days in seconds
        
        const currentTimestamp = Math.floor(Date.now() / 1000); // Current time in seconds
        
        const accToken = await jwt.sign({
            sub: id,
            iat: currentTimestamp,
            exp: currentTimestamp + accessTokenExp
        })
        
        accessToken.set({
            value: accToken,
            httpOnly: true,
            maxAge: accessTokenExp,
            path: '/',
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax'
        })

        const refToken = await jwt.sign({
            sub: id,
            iat: currentTimestamp,
            exp: currentTimestamp + refreshTokenExp
        })
        
        refreshToken.set({
            value: refToken,
            httpOnly: true,
            maxAge: refreshTokenExp,
            path: '/',
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax'
        })
    }

    async forgotPassword(email: string, jwt: JWTInstance) {
        try {
            if (!email) {
                return this._errorResponse('Email address is required', 400, 'ValidationError')
            }

            if (!RegExp(emailRegex).test(email)) {
                return this._errorResponse('Please provide a valid email address', 400, 'ValidationError')
            }

            const result = await this._factory.createService('general').forgotPassword(email, jwt)
            return this._response<typeof result>('Password reset instructions have been sent to your email address. Please check your inbox.', 200, result)
        } catch (error: any) {
            console.error('Forgot password error:', error)
            if (error.message?.includes('User not found')) {
                throw new NotFoundError('No account found with this email address. Please check your email or sign up for a new account.')
            }
            throw error
        }
    }

    async resetPassword(token: string, newPassword: string, jwt: JWTInstance) {
        try {
            if (!token) {
                throw new ValidationError('Reset token is required')
            }

            if (!newPassword) {
                throw new ValidationError('New password is required')
            }

            if (newPassword.length < 6) {
                throw new ValidationError('Password must be at least 6 characters long')
            }

            const result = await this._factory.createService('general').resetPassword(token, newPassword, jwt)
            return this._response<typeof result>('Your password has been reset successfully! You can now sign in with your new password.', 200, result)
        } catch (error: any) {
            console.error('Reset password error:', error)
            if (error.message?.includes('Invalid token') || error.message?.includes('Token expired')) {
                throw new UnauthorizedError('Password reset link is invalid or has expired. Please request a new password reset.')
            }
            throw error
        }
    }
}