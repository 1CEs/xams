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
    super(message, 409);
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
  status: string;
  message: string;
  errors?: any[];
  stack?: string;
}

// Error handling plugin
export const errorPlugin = new Elysia()
    .onError(({ code, error, set }) => {
        // Log error for development
        if (process.env.NODE_ENV === 'development') {
            console.error('Error 💥', error);
        }

        let err = { ...error };
        err.message = error.message;

        // Handle specific error types
        if (error.name === 'CastError') {
            const castError = error as Error & { path: string; value: string };
            const message = `Invalid ${castError.path}: ${castError.value}`;
            err = new BadRequestError(message);
        }

        if (error.name === 'ValidationError') {
            const errors = Object.values((error as any).errors).map((el: any) => el.message);
            const message = `Invalid input data. ${errors.join('. ')}`;
            err = new ValidationError(message);
        }

        if (error.name === 'JsonWebTokenError') {
            err = new UnauthorizedError('Invalid token. Please log in again!');
        }

        if (error.name === 'TokenExpiredError') {
            err = new UnauthorizedError('Your token has expired! Please log in again.');
        }

        // Default to 500 if status code is not set
        const statusCode = (err as any).statusCode || 500;
        const status = (err as any).status || 'error';

        // Prepare error response
        const errorResponse: ErrorResponse = {
            status,
            message: err.message || 'Something went wrong!',
        };

        // Add stack trace in development
        if (process.env.NODE_ENV === 'development') {
            errorResponse.stack = error.stack;
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
