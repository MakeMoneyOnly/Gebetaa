import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { sanitizeErrorMessage, logAndSanitize } from '@/lib/errors/sanitize';

/**
 * HIGH-023: Standardized error response format
 * All API errors return this format with sanitized messages
 */
export interface ApiErrorResponse {
    error: {
        code: string;
        message: string;
        requestId: string;
        details?: unknown;
    };
}

type _ErrorBody = {
    error: string;
    code?: string;
    details?: unknown;
};

type SuccessBody<T> = {
    data: T;
};

export function apiSuccess<T>(data: T, status: number = 200) {
    return NextResponse.json<SuccessBody<T>>({ data }, { status });
}

/**
 * Create an API error response with sanitized message
 *
 * HIGH-023: This function ensures error messages are sanitized
 * before being returned to clients while logging full details server-side
 *
 * @param error - Error message or Error object
 * @param status - HTTP status code
 * @param code - Error code for client handling
 * @param details - Additional details (will be sanitized)
 * @param context - Context for logging (operation, userId, etc.)
 */
export function apiError(
    error: string | Error | unknown,
    status: number = 400,
    code?: string,
    details?: unknown,
    context?: {
        operation?: string;
        userId?: string;
        restaurantId?: string;
    }
): NextResponse<ApiErrorResponse> {
    const requestId = randomUUID();
    const errorCode = code ?? 'ERROR';

    // Log full error server-side
    const sanitizedMessage = logAndSanitize(error, {
        operation: context?.operation ?? 'api_error',
        userId: context?.userId,
        restaurantId: context?.restaurantId,
        requestId,
    });

    // Create sanitized response
    const body: ApiErrorResponse = {
        error: {
            code: errorCode,
            message: sanitizedMessage,
            requestId,
        },
    };

    // Only include details if provided and safe
    if (typeof details !== 'undefined') {
        // Sanitize details if it's a string
        if (typeof details === 'string') {
            body.error.details = sanitizeErrorMessage(details);
        } else if (Array.isArray(details)) {
            // For validation errors, include them but sanitize strings
            body.error.details = details;
        }
    }

    return NextResponse.json(body, { status });
}

/**
 * Create an API error from an unknown error with automatic sanitization
 *
 * @param error - Unknown error to handle
 * @param context - Context for logging
 * @returns Sanitized error response
 */
export function handleApiError(
    error: unknown,
    context?: {
        operation?: string;
        userId?: string;
        restaurantId?: string;
    }
): NextResponse<ApiErrorResponse> {
    // Determine appropriate status code
    let status = 500;
    let code = 'INTERNAL_ERROR';

    if (error instanceof Error) {
        // Check for known error types
        if (error.name === 'ValidationError') {
            status = 400;
            code = 'VALIDATION_ERROR';
        } else if (error.name === 'UnauthorizedError' || error.name === 'AuthenticationError') {
            status = 401;
            code = 'UNAUTHORIZED';
        } else if (error.name === 'ForbiddenError' || error.name === 'AuthorizationError') {
            status = 403;
            code = 'FORBIDDEN';
        } else if (error.name === 'NotFoundError') {
            status = 404;
            code = 'NOT_FOUND';
        } else if (error.name === 'RateLimitError') {
            status = 429;
            code = 'RATE_LIMITED';
        }
    }

    // Check for PostgreSQL error codes
    const errorWithCode = error as Record<string, unknown>;
    if (typeof errorWithCode?.code === 'string') {
        const pgCode = errorWithCode.code;
        if (pgCode === '23505') {
            status = 409;
            code = 'DUPLICATE';
        } else if (pgCode === '23503') {
            status = 400;
            code = 'FOREIGN_KEY_VIOLATION';
        } else if (pgCode === '23502') {
            status = 400;
            code = 'NOT_NULL_VIOLATION';
        }
    }

    return apiError(error, status, code, undefined, context);
}
