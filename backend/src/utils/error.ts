import { Context, Elysia } from 'elysia';

// Custom error classes
export class AppError extends Error {
  statusCode: number;
  status: string;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string) {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string) {
    super(message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string) {
    super(message, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 422);
  }
}

export class InternalServerError extends AppError {
  constructor(message: string) {
    super(message, 500);
  }
}

// Error response interface
interface ErrorResponse {
  message: string;
  code: number;
  data: null;
  success: boolean;
  errorType: string;
  stack?: string;
}

// Error handling plugin
export const errorPlugin = new Elysia()
    .onError(({ code, error, set }) => {
        // Log error for development
        if (process.env.NODE_ENV === 'development') {
            console.error('Error 💥', error);
            console.error('Error type:', typeof error);
            console.error('Error instanceof AppError:', error instanceof AppError);
            console.error('Error statusCode:', (error as any).statusCode);
            console.error('Error constructor name:', error.constructor?.name);
        }

        let processedError: AppError;
        let errorMessage = 'Something went wrong!';
        let errorType = 'InternalServerError';

        // Handle AppError instances (our custom errors)
        const errorObj = error as any;
        
        // Check for ConflictError specifically first
        if (errorObj.constructor?.name === 'ConflictError' || 
            (errorObj.statusCode === 400 && errorObj.message?.includes('already taken'))) {
            processedError = new ConflictError(errorObj.message);
            errorMessage = errorObj.message;
            errorType = 'ConflictError';
        } else if (error instanceof AppError || errorObj.statusCode) {
            processedError = error as AppError;
            errorMessage = errorObj.message || 'Something went wrong!';
            errorType = errorObj.constructor?.name || 'AppError';
        } else if (errorObj.name === 'CastError') {
            const message = `Invalid ${errorObj.path}: ${errorObj.value}`;
            processedError = new BadRequestError(message);
            errorMessage = message;
            errorType = 'BadRequestError';
        } else if (errorObj.name === 'ValidationError') {
            const errors = Object.values(errorObj.errors || {}).map((el: any) => el.message);
            const message = `Invalid input data. ${errors.join('. ')}`;
            processedError = new ValidationError(message);
            errorMessage = message;
            errorType = 'ValidationError';
        } else if (errorObj.name === 'JsonWebTokenError') {
            processedError = new UnauthorizedError('Invalid token. Please log in again!');
            errorMessage = 'Invalid token. Please log in again!';
            errorType = 'UnauthorizedError';
        } else if (errorObj.name === 'TokenExpiredError') {
            processedError = new UnauthorizedError('Your token has expired! Please log in again.');
            errorMessage = 'Your token has expired! Please log in again.';
            errorType = 'UnauthorizedError';
        } else {
            // Default error handling
            processedError = new InternalServerError(errorObj.message || 'Something went wrong!');
            errorMessage = errorObj.message || 'Something went wrong!';
            errorType = 'InternalServerError';
        }

        // Get status code from processed error
        const statusCode = processedError.statusCode;

        // Prepare error response in the expected format
        const errorResponse: ErrorResponse = {
            message: errorMessage,
            code: statusCode,
            data: null,
            success: false,
            errorType
        };

        // Add stack trace in development
        if (process.env.NODE_ENV === 'development') {
            const errorObj = error as any;
            if (errorObj.stack) {
                errorResponse.stack = errorObj.stack;
            }
        }

        // Set status and return response
        set.status = statusCode;
        return errorResponse;
    });

// Async error handler wrapper
export const catchAsync = (fn: Function) => {
    return async (context: Context) => {
        try {
            return await fn(context);
        } catch (error) {
            throw error;
        }
    };
};
