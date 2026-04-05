/**
 * Tests for standardized error handling (MED-021)
 */

import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import {
    AppError,
    ValidationError,
    UnauthorizedError,
    ForbiddenError,
    NotFoundError,
    ConflictError,
    RateLimitError,
    InternalError,
    ERROR_STATUS_MAP,
    notFound,
    validationErrorFromZod,
    validationError,
    unauthorized,
    forbidden,
    conflict,
    rateLimited,
    internalError,
    isAppError,
    isValidationError,
    isUnauthorizedError,
    isForbiddenError,
    isNotFoundError,
    isConflictError,
    isRateLimitError,
    toAppError,
    type ErrorCode,
} from '../errors';

describe('AppError', () => {
    it('should create an error with all properties', () => {
        const error = new AppError('VALIDATION_ERROR', 'Test error', 400, { field: 'test' });

        expect(error.code).toBe('VALIDATION_ERROR');
        expect(error.message).toBe('Test error');
        expect(error.statusCode).toBe(400);
        expect(error.details).toEqual({ field: 'test' });
        expect(error.name).toBe('AppError');
    });

    it('should use default status code from ERROR_STATUS_MAP', () => {
        const error = new AppError('NOT_FOUND', 'Not found');
        expect(error.statusCode).toBe(404);
    });

    it('should convert to JSON correctly', () => {
        const error = new AppError('VALIDATION_ERROR', 'Test', 400, { field: 'test' });
        const json = error.toJSON();

        expect(json).toEqual({
            code: 'VALIDATION_ERROR',
            message: 'Test',
            details: { field: 'test' },
        });
    });

    it('should omit undefined details from JSON', () => {
        const error = new AppError('NOT_FOUND', 'Not found', 404);
        const json = error.toJSON();

        expect(json).toEqual({
            code: 'NOT_FOUND',
            message: 'Not found',
        });
    });
});

describe('Error Classes', () => {
    describe('ValidationError', () => {
        it('should create validation error with correct properties', () => {
            const error = new ValidationError('Invalid input', { field: 'email' });

            expect(error.code).toBe('VALIDATION_ERROR');
            expect(error.statusCode).toBe(400);
            expect(error.name).toBe('ValidationError');
        });
    });

    describe('UnauthorizedError', () => {
        it('should create with default message', () => {
            const error = new UnauthorizedError();

            expect(error.code).toBe('UNAUTHORIZED');
            expect(error.statusCode).toBe(401);
            expect(error.message).toBe('Authentication required');
        });

        it('should accept custom message', () => {
            const error = new UnauthorizedError('Token expired');
            expect(error.message).toBe('Token expired');
        });
    });

    describe('ForbiddenError', () => {
        it('should create with default message', () => {
            const error = new ForbiddenError();

            expect(error.code).toBe('FORBIDDEN');
            expect(error.statusCode).toBe(403);
            expect(error.message).toBe('Access denied');
        });

        it('should accept custom message', () => {
            const error = new ForbiddenError('Admin only');
            expect(error.message).toBe('Admin only');
        });
    });

    describe('NotFoundError', () => {
        it('should create with resource name only', () => {
            const error = new NotFoundError('Order');

            expect(error.code).toBe('NOT_FOUND');
            expect(error.statusCode).toBe(404);
            expect(error.message).toBe('Order not found');
        });

        it('should include identifier when provided', () => {
            const error = new NotFoundError('Order', '123');
            expect(error.message).toBe('Order not found: 123');
        });
    });

    describe('ConflictError', () => {
        it('should create conflict error', () => {
            const error = new ConflictError('Resource already exists', { id: '123' });

            expect(error.code).toBe('CONFLICT');
            expect(error.statusCode).toBe(409);
            expect(error.details).toEqual({ id: '123' });
        });
    });

    describe('RateLimitError', () => {
        it('should create rate limit error with default message', () => {
            const error = new RateLimitError();

            expect(error.code).toBe('RATE_LIMITED');
            expect(error.statusCode).toBe(429);
            expect(error.message).toBe('Too many requests');
        });

        it('should include retryAfter', () => {
            const error = new RateLimitError('Slow down', 60);

            expect(error.retryAfter).toBe(60);
            expect(error.details).toEqual({ retryAfter: 60 });
        });
    });

    describe('InternalError', () => {
        it('should create internal error with default message', () => {
            const error = new InternalError();

            expect(error.code).toBe('INTERNAL_ERROR');
            expect(error.statusCode).toBe(500);
            expect(error.message).toBe('An unexpected error occurred');
        });

        it('should accept custom message and details', () => {
            const error = new InternalError('Database failed', { query: 'SELECT' });
            expect(error.message).toBe('Database failed');
            expect(error.details).toEqual({ query: 'SELECT' });
        });
    });
});

describe('Error Factory Functions', () => {
    describe('notFound', () => {
        it('should create NotFoundError', () => {
            const error = notFound('Guest', '456');
            expect(error).toBeInstanceOf(NotFoundError);
            expect(error.message).toBe('Guest not found: 456');
        });
    });

    describe('validationErrorFromZod', () => {
        it('should convert ZodError to ValidationError', () => {
            const schema = z.object({
                email: z.string().email(),
                age: z.number().min(0),
            });

            const result = schema.safeParse({ email: 'invalid', age: -1 });
            if (!result.success) {
                const error = validationErrorFromZod(result.error);

                expect(error).toBeInstanceOf(ValidationError);
                expect(error.details).toBeInstanceOf(Array);
                expect((error.details as Array<unknown>).length).toBeGreaterThan(0);
            }
        });
    });

    describe('validationError', () => {
        it('should create ValidationError with message only', () => {
            const error = validationError('Invalid email');
            expect(error).toBeInstanceOf(ValidationError);
            expect(error.message).toBe('Invalid email');
        });

        it('should create ValidationError with details', () => {
            const error = validationError('Invalid input', { fields: ['email', 'name'] });
            expect(error.details).toEqual({ fields: ['email', 'name'] });
        });
    });

    describe('unauthorized', () => {
        it('should create UnauthorizedError with default message', () => {
            const error = unauthorized();
            expect(error).toBeInstanceOf(UnauthorizedError);
            expect(error.message).toBe('Authentication required');
        });

        it('should create UnauthorizedError with custom message', () => {
            const error = unauthorized('Session expired');
            expect(error.message).toBe('Session expired');
        });
    });

    describe('forbidden', () => {
        it('should create ForbiddenError with action and resource', () => {
            const error = forbidden('delete', 'order');
            expect(error).toBeInstanceOf(ForbiddenError);
            expect(error.message).toBe('You do not have permission to delete this order');
        });
    });

    describe('conflict', () => {
        it('should create ConflictError with resource only', () => {
            const error = conflict('User');
            expect(error).toBeInstanceOf(ConflictError);
            expect(error.message).toBe('User already exists');
        });

        it('should create ConflictError with identifier', () => {
            const error = conflict('User', 'john@example.com');
            expect(error.message).toBe('User already exists: john@example.com');
        });
    });

    describe('rateLimited', () => {
        it('should create RateLimitError', () => {
            const error = rateLimited(30);
            expect(error).toBeInstanceOf(RateLimitError);
            expect(error.retryAfter).toBe(30);
        });
    });

    describe('internalError', () => {
        it('should create InternalError', () => {
            const error = internalError('Something went wrong');
            expect(error).toBeInstanceOf(InternalError);
            expect(error.message).toBe('Something went wrong');
        });
    });
});

describe('Type Guards', () => {
    it('should identify AppError', () => {
        expect(isAppError(new AppError('NOT_FOUND', 'Test'))).toBe(true);
        expect(isAppError(new Error('Test'))).toBe(false);
        expect(isAppError(null)).toBe(false);
        expect(isAppError('error')).toBe(false);
    });

    it('should identify ValidationError', () => {
        expect(isValidationError(new ValidationError('Test'))).toBe(true);
        expect(isValidationError(new AppError('VALIDATION_ERROR', 'Test'))).toBe(false);
    });

    it('should identify UnauthorizedError', () => {
        expect(isUnauthorizedError(new UnauthorizedError())).toBe(true);
        expect(isUnauthorizedError(new ForbiddenError())).toBe(false);
    });

    it('should identify ForbiddenError', () => {
        expect(isForbiddenError(new ForbiddenError())).toBe(true);
        expect(isForbiddenError(new UnauthorizedError())).toBe(false);
    });

    it('should identify NotFoundError', () => {
        expect(isNotFoundError(new NotFoundError('Test'))).toBe(true);
        expect(isNotFoundError(new ValidationError('Test'))).toBe(false);
    });

    it('should identify ConflictError', () => {
        expect(isConflictError(new ConflictError('Test'))).toBe(true);
        expect(isConflictError(new NotFoundError('Test'))).toBe(false);
    });

    it('should identify RateLimitError', () => {
        expect(isRateLimitError(new RateLimitError())).toBe(true);
        expect(isRateLimitError(new InternalError())).toBe(false);
    });
});

describe('toAppError', () => {
    it('should return AppError unchanged', () => {
        const original = new NotFoundError('Order', '123');
        const converted = toAppError(original);

        expect(converted).toBe(original);
    });

    it('should convert ZodError to ValidationError', () => {
        const schema = z.string().email();
        const result = schema.safeParse('invalid');

        if (!result.success) {
            const converted = toAppError(result.error);
            expect(converted).toBeInstanceOf(ValidationError);
            expect(converted.code).toBe('VALIDATION_ERROR');
        }
    });

    it('should convert PostgreSQL unique violation to ConflictError', () => {
        const pgError = new Error('Duplicate key') as Error & { code: string };
        pgError.code = '23505';

        const converted = toAppError(pgError);
        expect(converted).toBeInstanceOf(ConflictError);
    });

    it('should convert PostgreSQL foreign key violation to ValidationError', () => {
        const pgError = new Error('FK violation') as Error & { code: string };
        pgError.code = '23503';

        const converted = toAppError(pgError);
        expect(converted).toBeInstanceOf(ValidationError);
    });

    it('should convert PostgreSQL not null violation to ValidationError', () => {
        const pgError = new Error('Not null') as Error & { code: string };
        pgError.code = '23502';

        const converted = toAppError(pgError);
        expect(converted).toBeInstanceOf(ValidationError);
    });

    it('should convert generic Error to InternalError', () => {
        const error = new Error('Something went wrong');
        const converted = toAppError(error);

        expect(converted).toBeInstanceOf(InternalError);
        expect(converted.message).toBe('Something went wrong');
    });

    it('should convert unknown to InternalError', () => {
        const converted = toAppError('string error');
        expect(converted).toBeInstanceOf(InternalError);
        expect(converted.message).toBe('An unexpected error occurred');
    });
});

describe('ERROR_STATUS_MAP', () => {
    it('should have all error codes mapped', () => {
        const codes: ErrorCode[] = [
            'VALIDATION_ERROR',
            'UNAUTHORIZED',
            'FORBIDDEN',
            'NOT_FOUND',
            'CONFLICT',
            'RATE_LIMITED',
            'INTERNAL_ERROR',
        ];

        for (const code of codes) {
            expect(ERROR_STATUS_MAP[code]).toBeDefined();
            expect(typeof ERROR_STATUS_MAP[code]).toBe('number');
        }
    });

    it('should map codes to correct HTTP status codes', () => {
        expect(ERROR_STATUS_MAP.VALIDATION_ERROR).toBe(400);
        expect(ERROR_STATUS_MAP.UNAUTHORIZED).toBe(401);
        expect(ERROR_STATUS_MAP.FORBIDDEN).toBe(403);
        expect(ERROR_STATUS_MAP.NOT_FOUND).toBe(404);
        expect(ERROR_STATUS_MAP.CONFLICT).toBe(409);
        expect(ERROR_STATUS_MAP.RATE_LIMITED).toBe(429);
        expect(ERROR_STATUS_MAP.INTERNAL_ERROR).toBe(500);
    });
});
