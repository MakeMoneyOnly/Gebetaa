import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    loleGraphQLError,
    createErrorResult,
    handleResolverError,
    NOT_IMPLEMENTED_ERROR,
    UNAUTHORIZED_ERROR,
    FORBIDDEN_ERROR,
    NOT_FOUND_ERROR,
    TENANT_ISOLATION_ERROR,
    VALIDATION_ERROR,
    INTERNAL_ERROR,
    ErrorCode,
    ErrorResult,
} from '../errors';

describe('GraphQL Errors', () => {
    describe('loleGraphQLError', () => {
        it('should create error with code and message', () => {
            const error = new loleGraphQLError('Test error', 'NOT_FOUND');

            expect(error).toBeInstanceOf(loleGraphQLError);
            expect(error.message).toBe('Test error');
            expect(error.code).toBe('NOT_FOUND');
        });

        it('should create error with details', () => {
            const details = { resourceId: '123', resourceType: 'Order' };
            const error = new loleGraphQLError('Resource not found', 'NOT_FOUND', details);

            expect(error.details).toEqual(details);
            expect(error.extensions?.resourceId).toBe('123');
            expect(error.extensions?.resourceType).toBe('Order');
        });

        it('should include code in extensions', () => {
            const error = new loleGraphQLError('Unauthorized access', 'UNAUTHORIZED');

            expect(error.extensions?.code).toBe('UNAUTHORIZED');
        });

        it('should support all error codes', () => {
            const codes: ErrorCode[] = [
                'UNAUTHORIZED',
                'FORBIDDEN',
                'NOT_FOUND',
                'VALIDATION_ERROR',
                'TENANT_ISOLATION_VIOLATION',
                'INTERNAL_ERROR',
                'NOT_IMPLEMENTED',
                'BAD_USER_INPUT',
            ];

            codes.forEach(code => {
                const error = new loleGraphQLError(`Error for ${code}`, code);
                expect(error.code).toBe(code);
            });
        });
    });

    describe('createErrorResult', () => {
        it('should create error result with code and message', () => {
            const result = createErrorResult('VALIDATION_ERROR', 'Invalid input');

            expect(result.success).toBe(false);
            expect(result.error.code).toBe('VALIDATION_ERROR');
            expect(result.error.message).toBe('Invalid input');
        });

        it('should create error result with Amharic message', () => {
            const result = createErrorResult('NOT_FOUND', 'Resource not found', 'ግብዓት አልተገኘም');

            expect(result.success).toBe(false);
            expect(result.error.messageAm).toBe('ግብዓት አልተገኘም');
        });

        it('should always return success: false', () => {
            const codes: ErrorCode[] = [
                'UNAUTHORIZED',
                'FORBIDDEN',
                'NOT_FOUND',
                'VALIDATION_ERROR',
                'INTERNAL_ERROR',
            ];

            codes.forEach(code => {
                const result = createErrorResult(code, `Error for ${code}`);
                expect(result.success).toBe(false);
            });
        });
    });

    describe('handleResolverError', () => {
        let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

        beforeEach(() => {
            consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        });

        afterEach(() => {
            consoleErrorSpy.mockRestore();
        });

        it('should handle loleGraphQLError', () => {
            const error = new loleGraphQLError('Test error', 'NOT_FOUND');
            const result = handleResolverError(error);

            expect(result.error.code).toBe('NOT_FOUND');
            expect(result.error.message).toBe('Test error');
            expect(consoleErrorSpy).not.toHaveBeenCalled();
        });

        it('should handle loleGraphQLError with details', () => {
            const error = new loleGraphQLError('Validation failed', 'VALIDATION_ERROR', {
                field: 'email',
            });
            const result = handleResolverError(error);

            expect(result.error.code).toBe('VALIDATION_ERROR');
            expect(result.error.message).toBe('Validation failed');
        });

        it('should handle generic Error', () => {
            const error = new Error('Generic error');
            const result = handleResolverError(error);

            expect(result.error.code).toBe('INTERNAL_ERROR');
            expect(result.error.message).toBe('An unexpected error occurred');
            expect(consoleErrorSpy).toHaveBeenCalledWith('Resolver error:', error);
        });

        it('should handle non-Error objects', () => {
            const result = handleResolverError('string error');

            expect(result.error.code).toBe('INTERNAL_ERROR');
            expect(result.error.message).toBe('An unexpected error occurred');
        });

        it('should handle null error', () => {
            const result = handleResolverError(null);

            expect(result.error.code).toBe('INTERNAL_ERROR');
            expect(result.error.message).toBe('An unexpected error occurred');
        });

        it('should handle undefined error', () => {
            const result = handleResolverError(undefined);

            expect(result.error.code).toBe('INTERNAL_ERROR');
            expect(result.error.message).toBe('An unexpected error occurred');
        });

        it('should handle object errors', () => {
            const objectError = { message: 'Some error', code: 500 };
            const result = handleResolverError(objectError);

            expect(result.error.code).toBe('INTERNAL_ERROR');
            expect(result.error.message).toBe('An unexpected error occurred');
        });
    });

    describe('Pre-defined error results', () => {
        it('NOT_IMPLEMENTED_ERROR should have correct shape', () => {
            expect(NOT_IMPLEMENTED_ERROR.success).toBe(false);
            expect(NOT_IMPLEMENTED_ERROR.error.code).toBe('NOT_IMPLEMENTED');
            expect(NOT_IMPLEMENTED_ERROR.error.message).toBe('This feature is not yet implemented');
        });

        it('UNAUTHORIZED_ERROR should have correct shape', () => {
            expect(UNAUTHORIZED_ERROR.success).toBe(false);
            expect(UNAUTHORIZED_ERROR.error.code).toBe('UNAUTHORIZED');
            expect(UNAUTHORIZED_ERROR.error.message).toBe('Authentication required');
        });

        it('FORBIDDEN_ERROR should have correct shape', () => {
            expect(FORBIDDEN_ERROR.success).toBe(false);
            expect(FORBIDDEN_ERROR.error.code).toBe('FORBIDDEN');
            expect(FORBIDDEN_ERROR.error.message).toBe(
                'You do not have permission to perform this action'
            );
        });

        it('NOT_FOUND_ERROR should have correct shape', () => {
            expect(NOT_FOUND_ERROR.success).toBe(false);
            expect(NOT_FOUND_ERROR.error.code).toBe('NOT_FOUND');
            expect(NOT_FOUND_ERROR.error.message).toBe('Resource not found');
        });

        it('TENANT_ISOLATION_ERROR should have correct shape', () => {
            expect(TENANT_ISOLATION_ERROR.success).toBe(false);
            expect(TENANT_ISOLATION_ERROR.error.code).toBe('TENANT_ISOLATION_VIOLATION');
            expect(TENANT_ISOLATION_ERROR.error.message).toBe(
                'Access denied: resource belongs to a different restaurant'
            );
        });

        it('VALIDATION_ERROR should have correct shape', () => {
            expect(VALIDATION_ERROR.success).toBe(false);
            expect(VALIDATION_ERROR.error.code).toBe('VALIDATION_ERROR');
            expect(VALIDATION_ERROR.error.message).toBe('Invalid input provided');
        });

        it('INTERNAL_ERROR should have correct shape', () => {
            expect(INTERNAL_ERROR.success).toBe(false);
            expect(INTERNAL_ERROR.error.code).toBe('INTERNAL_ERROR');
            expect(INTERNAL_ERROR.error.message).toBe('An unexpected error occurred');
        });
    });

    describe('ErrorResult type', () => {
        it('should be usable as return type for mutations', () => {
            function mockMutation(): ErrorResult | { success: true; data: unknown } {
                return createErrorResult('NOT_FOUND', 'Order not found');
            }

            const result = mockMutation();
            if (!result.success) {
                expect(result.error.code).toBeDefined();
                expect(result.error.message).toBeDefined();
            }
        });
    });
});
