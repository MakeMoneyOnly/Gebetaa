/**
 * Tests for Error Message Sanitization
 *
 * Tests cover:
 * - Sensitive pattern removal
 * - Error type handling
 * - Database error code mapping
 * - API response creation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { sanitizeErrorMessage, createSanitizedErrorResponse, logAndSanitize } from '../sanitize';

describe('Error Message Sanitization', () => {
    describe('sanitizeErrorMessage', () => {
        describe('null and undefined handling', () => {
            it('should return generic internal error for null', () => {
                expect(sanitizeErrorMessage(null)).toBe(
                    'An internal error occurred. Please try again.'
                );
            });

            it('should return generic internal error for undefined', () => {
                expect(sanitizeErrorMessage(undefined)).toBe(
                    'An internal error occurred. Please try again.'
                );
            });

            it('should use fallback message for null when provided', () => {
                expect(sanitizeErrorMessage(null, { fallbackMessage: 'Custom fallback' })).toBe(
                    'Custom fallback'
                );
            });
        });

        describe('string error handling', () => {
            it('should return safe string messages unchanged', () => {
                expect(sanitizeErrorMessage('Something went wrong')).toBe('Something went wrong');
            });

            it('should redact file paths from string errors', () => {
                const result = sanitizeErrorMessage(
                    'Error reading file /home/user/app/config.json'
                );
                expect(result).not.toContain('/home/user/app');
                expect(result).toContain('[REDACTED]');
            });

            it('should redact Windows file paths', () => {
                const result = sanitizeErrorMessage(
                    'Error reading C:\\Users\\admin\\secrets\\key.pem'
                );
                expect(result).not.toContain('C:\\Users\\admin');
                expect(result).toContain('[REDACTED]');
            });

            it('should redact database connection strings', () => {
                const result = sanitizeErrorMessage(
                    'Failed to connect to postgresql://user:pass@localhost:5432/db'
                );
                expect(result).not.toContain('postgresql://user:pass');
                expect(result).toContain('[REDACTED]');
            });

            it('should redact API keys', () => {
                // When message is heavily redacted, returns generic message
                const result = sanitizeErrorMessage('api_key=sk-1234567890abcdef');
                expect(result).not.toContain('sk-1234567890abcdef');
                // Message is heavily redacted so returns generic message
                expect(result).toBe('An internal error occurred. Please try again.');
            });

            it('should redact tokens', () => {
                // When message is heavily redacted, returns generic message
                const result = sanitizeErrorMessage('token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9');
                expect(result).not.toContain('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9');
                // Message is heavily redacted so returns generic message
                expect(result).toBe('An internal error occurred. Please try again.');
            });

            it('should redact internal IP addresses', () => {
                const result = sanitizeErrorMessage('Connection from 192.168.1.100 failed');
                expect(result).not.toContain('192.168.1.100');
                expect(result).toContain('[REDACTED]');
            });

            it('should redact stack traces', () => {
                // When message is heavily redacted, returns generic message
                const result = sanitizeErrorMessage(
                    'Error at Object.handler (app:///_app/page.tsx:100:25)'
                );
                expect(result).not.toContain('app:///_app/page.tsx');
                // Message is heavily redacted so returns generic message
                expect(result).toBe('An internal error occurred. Please try again.');
            });

            it('should redact SQL queries', () => {
                const result = sanitizeErrorMessage(
                    'Error executing SELECT * FROM users WHERE id = 1'
                );
                expect(result).not.toContain('SELECT * FROM users');
                expect(result).toContain('[REDACTED]');
            });

            it('should redact environment variable references', () => {
                const result = sanitizeErrorMessage('process.env.DATABASE_URL is not set');
                expect(result).not.toContain('process.env.DATABASE_URL');
                expect(result).toContain('[REDACTED]');
            });

            it('should use fallback when message is heavily redacted', () => {
                const result = sanitizeErrorMessage(
                    '/home/user/app/node_modules/package/file.js:100:50',
                    { fallbackMessage: 'Custom error' }
                );
                expect(result).toBe('Custom error');
            });
        });

        describe('Error object handling', () => {
            it('should handle ValidationError', () => {
                const error = new Error('Invalid input');
                error.name = 'ValidationError';
                expect(sanitizeErrorMessage(error)).toBe(
                    'Invalid input provided. Please check your request.'
                );
            });

            it('should handle UnauthorizedError', () => {
                const error = new Error('Token expired');
                error.name = 'UnauthorizedError';
                expect(sanitizeErrorMessage(error)).toBe(
                    'Authentication failed. Please check your credentials.'
                );
            });

            it('should handle AuthenticationError', () => {
                const error = new Error('Invalid credentials');
                error.name = 'AuthenticationError';
                expect(sanitizeErrorMessage(error)).toBe(
                    'Authentication failed. Please check your credentials.'
                );
            });

            it('should handle ForbiddenError', () => {
                const error = new Error('Access denied');
                error.name = 'ForbiddenError';
                expect(sanitizeErrorMessage(error)).toBe(
                    'You do not have permission to perform this action.'
                );
            });

            it('should handle AuthorizationError', () => {
                const error = new Error('Not authorized');
                error.name = 'AuthorizationError';
                expect(sanitizeErrorMessage(error)).toBe(
                    'You do not have permission to perform this action.'
                );
            });

            it('should handle NotFoundError', () => {
                const error = new Error('Resource not found');
                error.name = 'NotFoundError';
                expect(sanitizeErrorMessage(error)).toBe('The requested resource was not found.');
            });

            it('should handle TimeoutError', () => {
                const error = new Error('Request timed out');
                error.name = 'TimeoutError';
                expect(sanitizeErrorMessage(error)).toBe(
                    'The request timed out. Please try again.'
                );
            });

            it('should handle RateLimitError', () => {
                const error = new Error('Too many requests');
                error.name = 'RateLimitError';
                expect(sanitizeErrorMessage(error)).toBe(
                    'Too many requests. Please wait and try again.'
                );
            });

            it('should detect rate limit in message', () => {
                const error = new Error('rate limit exceeded');
                expect(sanitizeErrorMessage(error)).toBe(
                    'Too many requests. Please wait and try again.'
                );
            });

            it('should handle database error codes', () => {
                const error = new Error('Duplicate key violation') as Error & { code: string };
                error.code = '23505';
                expect(sanitizeErrorMessage(error)).toBe('This record already exists.');
            });

            it('should handle foreign key violation', () => {
                const error = new Error('Foreign key violation') as Error & { code: string };
                error.code = '23503';
                expect(sanitizeErrorMessage(error)).toBe(
                    'Cannot delete this record as it is referenced elsewhere.'
                );
            });

            it('should handle not null violation', () => {
                const error = new Error('Not null violation') as Error & { code: string };
                error.code = '23502';
                expect(sanitizeErrorMessage(error)).toBe('A required field is missing.');
            });

            it('should handle connection error', () => {
                const error = new Error('Connection failed') as Error & { code: string };
                error.code = '08006';
                expect(sanitizeErrorMessage(error)).toBe('A database connection error occurred.');
            });

            it('should handle SQLSTATE codes in message', () => {
                const error = new Error('Database error: SQLSTATE[23505]');
                expect(sanitizeErrorMessage(error)).toBe('This record already exists.');
            });

            it('should sanitize generic error messages', () => {
                const error = new Error('Error at /app/src/file.ts:10:5 with api_key=secret123');
                const result = sanitizeErrorMessage(error);
                expect(result).not.toContain('secret123');
                expect(result).not.toContain('/app/src/file.ts');
            });

            it('should use fallback for heavily redacted errors', () => {
                const error = new Error('/home/user/app/node_modules/package/index.js:1:1');
                const result = sanitizeErrorMessage(error, { fallbackMessage: 'Custom fallback' });
                expect(result).toBe('Custom fallback');
            });
        });

        describe('object error handling', () => {
            it('should handle object with code property', () => {
                expect(sanitizeErrorMessage({ code: '400' })).toBe(
                    'Invalid request. Please check your input.'
                );
            });

            it('should handle object with numeric code', () => {
                expect(sanitizeErrorMessage({ code: 404 })).toBe('Not found.');
            });

            it('should handle object with message property', () => {
                expect(sanitizeErrorMessage({ message: 'Simple error' })).toBe('Simple error');
            });

            it('should handle object with error property', () => {
                expect(sanitizeErrorMessage({ error: 'Error string' })).toBe('Error string');
            });

            it('should sanitize message in object', () => {
                const result = sanitizeErrorMessage({
                    message: 'Error with api_key=secret123',
                });
                expect(result).not.toContain('secret123');
            });

            it('should use fallback for unknown objects', () => {
                expect(sanitizeErrorMessage({ unknown: 'property' })).toBe(
                    'An internal error occurred. Please try again.'
                );
            });

            it('should use custom fallback for unknown objects', () => {
                expect(
                    sanitizeErrorMessage({ unknown: 'property' }, { fallbackMessage: 'Custom' })
                ).toBe('Custom');
            });
        });
    });

    describe('createSanitizedErrorResponse', () => {
        it('should create error response with default code', () => {
            const response = createSanitizedErrorResponse(new Error('Test error'));
            expect(response.error.code).toBe('INTERNAL_ERROR');
            expect(response.error.message).toBe('Test error');
        });

        it('should create error response with custom code', () => {
            const response = createSanitizedErrorResponse(new Error('Test error'), {
                code: 'VALIDATION_ERROR',
            });
            expect(response.error.code).toBe('VALIDATION_ERROR');
        });

        it('should sanitize error message in response', () => {
            const response = createSanitizedErrorResponse(
                new Error('Error with api_key=secret123')
            );
            expect(response.error.message).not.toContain('secret123');
        });

        it('should include operation context', () => {
            const response = createSanitizedErrorResponse(new Error('Test'), {
                operation: 'createOrder',
            });
            expect(response).toHaveProperty('error.message');
        });

        it('should include resource context', () => {
            const response = createSanitizedErrorResponse(new Error('Test'), {
                resource: 'orders',
            });
            expect(response).toHaveProperty('error.message');
        });
    });

    describe('logAndSanitize', () => {
        let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

        beforeEach(() => {
            consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        });

        afterEach(() => {
            consoleErrorSpy.mockRestore();
        });

        it('should log error and return sanitized message', () => {
            const result = logAndSanitize(new Error('Test error'), {
                operation: 'testOperation',
            });

            expect(result).toBe('Test error');
            expect(consoleErrorSpy).toHaveBeenCalled();
        });

        it('should log with all context fields', () => {
            logAndSanitize(new Error('Test error'), {
                operation: 'testOperation',
                userId: 'user-123',
                restaurantId: 'restaurant-456',
                requestId: 'request-789',
            });

            expect(consoleErrorSpy).toHaveBeenCalledWith(
                '[Error]',
                expect.objectContaining({
                    operation: 'testOperation',
                    userId: 'user-123',
                    restaurantId: 'restaurant-456',
                    requestId: 'request-789',
                })
            );
        });

        it('should log error object with name, message, and stack', () => {
            const error = new Error('Test error');
            logAndSanitize(error, { operation: 'testOperation' });

            const loggedData = consoleErrorSpy.mock.calls[0][1];
            expect(loggedData.error).toHaveProperty('name', 'Error');
            expect(loggedData.error).toHaveProperty('message', 'Test error');
            expect(loggedData.error).toHaveProperty('stack');
        });

        it('should log non-Error objects directly', () => {
            logAndSanitize('String error', { operation: 'testOperation' });

            const loggedData = consoleErrorSpy.mock.calls[0][1];
            expect(loggedData.error).toBe('String error');
        });

        it('should sanitize sensitive data in returned message', () => {
            const result = logAndSanitize(new Error('Error with api_key=secret123'), {
                operation: 'testOperation',
            });

            expect(result).not.toContain('secret123');
        });
    });
});
