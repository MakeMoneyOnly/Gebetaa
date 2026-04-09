import { describe, expect, it, vi } from 'vitest';
import { apiError, apiSuccess, handleApiError } from '@/lib/api/response';
import { AppError, ValidationError, NotFoundError } from '@/lib/api/errors';

// Mock the sanitize module to avoid side effects
vi.mock('@/lib/errors/sanitize', () => ({
    sanitizeErrorMessage: (msg: string) => msg,
    logAndSanitize: (error: unknown) => {
        if (error instanceof Error) return error.message;
        if (typeof error === 'string') return error;
        return 'An internal error occurred. Please try again.';
    },
}));

describe('apiSuccess', () => {
    it('should return JSON response with data and default status 200', () => {
        const response = apiSuccess({ id: '1', name: 'Test' });
        expect(response.status).toBe(200);
    });

    it('should return JSON response with custom status', () => {
        const response = apiSuccess({ id: '1' }, 201);
        expect(response.status).toBe(201);
    });

    it('should return JSON response with custom headers', () => {
        const headers = new Headers({ 'X-Custom': 'value' });
        const response = apiSuccess({ id: '1' }, 200, headers);
        expect(response.status).toBe(200);
    });
});

describe('apiError', () => {
    it('should return error response with default status 400', () => {
        const response = apiError('Test error');
        expect(response.status).toBe(400);
    });

    it('should return error response with custom status', () => {
        const response = apiError('Not found', 404);
        expect(response.status).toBe(404);
    });

    it('should return error response with custom code', async () => {
        const response = apiError('Test error', 400, 'VALIDATION_ERROR');
        const body = await response.json();
        expect(body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should default code to ERROR when not provided', async () => {
        const response = apiError('Test error');
        const body = await response.json();
        expect(body.error.code).toBe('ERROR');
    });

    it('should include requestId in response', async () => {
        const response = apiError('Test error');
        const body = await response.json();
        expect(body.error.requestId).toBeDefined();
        expect(typeof body.error.requestId).toBe('string');
    });

    it('should not include details when undefined', async () => {
        const response = apiError('Test error', 400, 'ERROR', undefined);
        const body = await response.json();
        expect(body.error.details).toBeUndefined();
    });

    it('should sanitize string details', async () => {
        const response = apiError('Test error', 400, 'ERROR', 'Some detail string');
        const body = await response.json();
        expect(body.error.details).toBe('Some detail string');
    });

    it('should include array details as-is', async () => {
        const details = [
            { field: 'email', message: 'Invalid email' },
            { field: 'name', message: 'Required' },
        ];
        const response = apiError('Validation failed', 400, 'VALIDATION_ERROR', details);
        const body = await response.json();
        expect(body.error.details).toEqual(details);
    });

    it('should not include details for non-string non-array types', async () => {
        const response = apiError('Test error', 400, 'ERROR', { key: 'value' });
        const body = await response.json();
        // Object details are neither string nor array, so they should not be included
        expect(body.error.details).toBeUndefined();
    });

    it('should handle Error objects as error parameter', async () => {
        const error = new Error('Something went wrong');
        const response = apiError(error, 500, 'INTERNAL_ERROR');
        const body = await response.json();
        expect(body.error.message).toBe('Something went wrong');
    });

    it('should include context in server-side logging', async () => {
        const response = apiError('Test error', 400, 'ERROR', undefined, {
            operation: 'createOrder',
            userId: 'user-1',
            restaurantId: 'rest-1',
        });
        expect(response.status).toBe(400);
        const body = await response.json();
        expect(body.error.message).toBe('Test error');
    });

    it('should handle empty string details', async () => {
        const response = apiError('Test error', 400, 'ERROR', '');
        const body = await response.json();
        // Empty string is still a string, so it should be sanitized (which returns it as-is in mock)
        expect(body.error.details).toBe('');
    });

    it('should handle empty array details', async () => {
        const response = apiError('Test error', 400, 'ERROR', []);
        const body = await response.json();
        expect(body.error.details).toEqual([]);
    });
});

describe('handleApiError', () => {
    it('should handle AppError directly', async () => {
        const error = new NotFoundError('Order', '123');
        const response = handleApiError(error);
        expect(response.status).toBe(404);
        const body = await response.json();
        expect(body.error.code).toBe('NOT_FOUND');
    });

    it('should handle ValidationError with details', async () => {
        const error = new ValidationError('Invalid input', [
            { field: 'email', message: 'Invalid' },
        ]);
        const response = handleApiError(error);
        expect(response.status).toBe(400);
        const body = await response.json();
        expect(body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should convert non-AppError to AppError', async () => {
        const response = handleApiError(new Error('Something broke'));
        expect(response.status).toBe(500);
        const body = await response.json();
        expect(body.error.code).toBe('INTERNAL_ERROR');
    });

    it('should convert string error to AppError', async () => {
        const response = handleApiError('string error');
        expect(response.status).toBe(500);
    });

    it('should convert unknown error to AppError', async () => {
        const response = handleApiError({ unknown: 'object' });
        expect(response.status).toBe(500);
    });

    it('should pass context through to apiError', async () => {
        const response = handleApiError(new Error('Test'), {
            operation: 'deleteOrder',
            userId: 'user-1',
            restaurantId: 'rest-1',
        });
        expect(response.status).toBe(500);
    });
});
