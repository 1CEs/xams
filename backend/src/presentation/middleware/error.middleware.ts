import Elysia from "elysia";
import { AuthorizationError } from "../errors/authorization.error";
import { AuthenticationError } from "../errors/authentication.error";
import { BadRequestError } from "../errors/badrequest.error";
import { ForbiddenError } from "../errors/forbidden.error";
import { TooManyRequestError } from "../errors/toomanyrequest.error";
import { 
    ConflictError, 
    ValidationError, 
    NotFoundError, 
    UnauthorizedError 
} from "../../utils/error";

export const errorMiddleware = new Elysia()
    .error('UNAUTHORIZED', AuthorizationError)
    .error('AUTHENTICATION_ERROR', AuthenticationError)
    .error('BAD_REQUEST', BadRequestError)
    .error('FORBIDDEN', ForbiddenError)
    .error('TOO_MANY_REQUEST', TooManyRequestError)
    .onError(({ code, error, set }) => {
        // Handle custom error classes from utils/error.ts
        if (error instanceof ConflictError) {
            set.status = 409
            return { 
                status: 'fail',
                message: error.message,
                code: 409
            }
        }
        
        if (error instanceof ValidationError) {
            set.status = 422
            return { 
                status: 'fail',
                message: error.message,
                code: 422
            }
        }
        
        if (error instanceof UnauthorizedError) {
            set.status = 401
            return { 
                status: 'fail',
                message: error.message,
                code: 401
            }
        }
        
        if (error instanceof NotFoundError) {
            set.status = 404
            return { 
                status: 'fail',
                message: error.message,
                code: 404
            }
        }

        switch (code) {
            case 'UNAUTHORIZED':
                set.status = 'Unauthorized'
                return { code: set.status, err: error.message }
            case 'NOT_FOUND':
                set.status = 'Not Found'
                return { code: set.status, err: error.message }
            case 'FORBIDDEN':
                set.status = 'Forbidden'
                return { code: set.status, err: error.message }
            case 'TOO_MANY_REQUEST':
                set.status = 'Too Many Requests'
                return { code: set.status, err: error.message }
            case 'BAD_REQUEST':
                set.status = 'Bad Request'
                return { code: set.status, err: error.message }
            case 'VALIDATION':
                set.status = 'Bad Request'
                let parsedError
                try {
                    parsedError = JSON.parse(error.message)
                } catch (e) {
                    parsedError = error.message
                }
                return { code, err: parsedError }
            default:
                set.status = 'Internal Server Error'
                console.error('Unhandled error:', error)
                // Handle case where error may not have message property
                const errorMessage = 'message' in error ? error.message : 'An unknown error occurred'
                return { 
                    status: 'error',
                    message: errorMessage,
                    code: 500
                }
        }
    })
