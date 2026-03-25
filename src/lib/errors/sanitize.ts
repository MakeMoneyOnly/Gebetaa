/**
 * Error Message Sanitization
 *
 * LOW-009: Sanitize error messages before returning to clients
 * Prevents exposure of internal system details, file paths, and sensitive data
 */

/**
 * Patterns that indicate sensitive information in error messages
 */
const SENSITIVE_PATTERNS = [
    // File paths
    /\/[\w\-./]+\/[\w\-./]+/g,
    /[A-Z]:\\[\w\-\\]+/g,
    // Connection strings
    /postgres(ql)?:\/\/[^\s]+/gi,
    /mongodb(\+srv)?:\/\/[^\s]+/gi,
    /redis:\/\/[^\s]+/gi,
    // API keys and tokens
    /api[_-]?key[=:]\s*[\w-]+/gi,
    /token[=:]\s*[\w-]+/gi,
    /secret[=:]\s*[\w-]+/gi,
    /password[=:]\s*[\w-]+/gi,
    // IP addresses (internal)
    /\b10\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g,
    /\b172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}\b/g,
    /\b192\.168\.\d{1,3}\.\d{1,3}\b/g,
    // Stack traces
    /at\s+[\w.]+\s*\([^)]+\)/g,
    /at\s+[\w.]+:\d+:\d+/g,
    // SQL queries
    /SELECT\s+.+\s+FROM/gi,
    /INSERT\s+.+\s+INTO/gi,
    /UPDATE\s+.+\s+SET/gi,
    /DELETE\s+FROM/gi,
    // Environment variables
    /process\.env\.\w+/g,
    /NEXT_PUBLIC_\w+/g,
    /SUPABASE_\w+/g,
    /REDIS_\w+/g,
];

/**
 * Generic error messages for common error types
 */
const GENERIC_MESSAGES: Record<string, string> = {
    database: 'A database error occurred. Please try again.',
    connection: 'Unable to connect to the service. Please try again.',
    authentication: 'Authentication failed. Please check your credentials.',
    authorization: 'You do not have permission to perform this action.',
    validation: 'Invalid input provided. Please check your request.',
    not_found: 'The requested resource was not found.',
    rate_limit: 'Too many requests. Please wait and try again.',
    internal: 'An internal error occurred. Please try again.',
    timeout: 'The request timed out. Please try again.',
    payment: 'Payment processing failed. Please try again.',
    webhook: 'Webhook processing failed.',
};

/**
 * Map error codes to generic messages
 */
const ERROR_CODE_MESSAGES: Record<string, string> = {
    // Database errors
    '23505': 'This record already exists.',
    '23503': 'Cannot delete this record as it is referenced elsewhere.',
    '23502': 'A required field is missing.',
    '08006': 'A database connection error occurred.',
    // HTTP status codes
    '400': 'Invalid request. Please check your input.',
    '401': 'Authentication required.',
    '403': 'Access denied.',
    '404': 'Not found.',
    '409': 'This resource already exists.',
    '429': 'Too many requests. Please wait.',
    '500': 'An internal error occurred.',
    '502': 'Service temporarily unavailable.',
    '503': 'Service temporarily unavailable.',
    '504': 'Request timed out.',
};

/**
 * Sanitize an error message for client consumption
 *
 * @param error - The error to sanitize
 * @param context - Optional context for determining appropriate message
 * @returns Sanitized error message safe for client display
 */
export function sanitizeErrorMessage(
    error: unknown,
    context?: {
        operation?: string;
        resource?: string;
        fallbackMessage?: string;
    }
): string {
    // Handle null/undefined
    if (error === null || error === undefined) {
        return context?.fallbackMessage ?? GENERIC_MESSAGES.internal;
    }

    // Handle string errors
    if (typeof error === 'string') {
        return sanitizeString(error, context?.fallbackMessage);
    }

    // Handle Error objects
    if (error instanceof Error) {
        return sanitizeError(error, context);
    }

    // Handle objects with error properties
    if (typeof error === 'object') {
        return sanitizeObject(error as Record<string, unknown>, context);
    }

    return context?.fallbackMessage ?? GENERIC_MESSAGES.internal;
}

/**
 * Sanitize a string error message
 */
function sanitizeString(message: string, fallback?: string): string {
    // Check for sensitive patterns
    const sanitized = removeSensitivePatterns(message);

    // If message was heavily modified, use generic message
    if (sanitized.length < message.length * 0.5) {
        return fallback ?? GENERIC_MESSAGES.internal;
    }

    return sanitized;
}

/**
 * Sanitize an Error object
 */
function sanitizeError(
    error: Error,
    context?: { operation?: string; resource?: string; fallbackMessage?: string }
): string {
    // Check for known error types with safe messages
    if (error.name === 'ValidationError') {
        return GENERIC_MESSAGES.validation;
    }

    if (error.name === 'UnauthorizedError' || error.name === 'AuthenticationError') {
        return GENERIC_MESSAGES.authentication;
    }

    if (error.name === 'ForbiddenError' || error.name === 'AuthorizationError') {
        return GENERIC_MESSAGES.authorization;
    }

    if (error.name === 'NotFoundError') {
        return GENERIC_MESSAGES.not_found;
    }

    if (error.name === 'TimeoutError') {
        return GENERIC_MESSAGES.timeout;
    }

    if (error.name === 'RateLimitError' || error.message.includes('rate limit')) {
        return GENERIC_MESSAGES.rate_limit;
    }

    // Check for database error codes
    const dbError = extractDatabaseErrorCode(error);
    if (dbError && ERROR_CODE_MESSAGES[dbError]) {
        return ERROR_CODE_MESSAGES[dbError];
    }

    // Check message for sensitive content
    const sanitizedMessage = removeSensitivePatterns(error.message);

    // If sanitized message is too different, use generic
    if (sanitizedMessage.length < error.message.length * 0.5 || sanitizedMessage.length < 10) {
        return context?.fallbackMessage ?? GENERIC_MESSAGES.internal;
    }

    return sanitizedMessage;
}

/**
 * Sanitize an error object
 */
function sanitizeObject(
    obj: Record<string, unknown>,
    context?: { operation?: string; resource?: string; fallbackMessage?: string }
): string {
    // Check for code property
    if (typeof obj.code === 'string' || typeof obj.code === 'number') {
        const codeMessage = ERROR_CODE_MESSAGES[String(obj.code)];
        if (codeMessage) {
            return codeMessage;
        }
    }

    // Check for message property
    if (typeof obj.message === 'string') {
        return sanitizeString(obj.message, context?.fallbackMessage);
    }

    // Check for error property
    if (typeof obj.error === 'string') {
        return sanitizeString(obj.error, context?.fallbackMessage);
    }

    return context?.fallbackMessage ?? GENERIC_MESSAGES.internal;
}

/**
 * Remove sensitive patterns from a string
 */
function removeSensitivePatterns(message: string): string {
    let sanitized = message;

    for (const pattern of SENSITIVE_PATTERNS) {
        sanitized = sanitized.replace(pattern, '[REDACTED]');
    }

    // Clean up multiple spaces and [REDACTED] repetitions
    sanitized = sanitized.replace(/\[REDACTED\](\s*\[REDACTED\])+/g, '[REDACTED]');
    sanitized = sanitized.replace(/\s+/g, ' ').trim();

    return sanitized;
}

/**
 * Extract database error code from error object
 */
function extractDatabaseErrorCode(error: Error): string | null {
    // PostgreSQL error codes are often in error.code
    // Use unknown first to safely check for code property
    const errorWithCode = error as unknown as Record<string, unknown>;
    if (typeof errorWithCode.code === 'string') {
        return errorWithCode.code;
    }

    // Check for PostgreSQL error in message
    const pgCodeMatch = error.message.match(/SQLSTATE\[(\w+)\]/);
    if (pgCodeMatch) {
        return pgCodeMatch[1];
    }

    return null;
}

/**
 * Create a sanitized error response object
 */
export interface SanitizedErrorResponse {
    error: {
        code: string;
        message: string;
        details?: unknown[];
    };
}

/**
 * Create a sanitized error response for API routes
 *
 * @param error - The original error
 * @param options - Options for the response
 * @returns Sanitized error response object
 */
export function createSanitizedErrorResponse(
    error: unknown,
    options?: {
        code?: string;
        statusCode?: number;
        operation?: string;
        resource?: string;
    }
): SanitizedErrorResponse {
    const message = sanitizeErrorMessage(error, {
        operation: options?.operation,
        resource: options?.resource,
    });

    return {
        error: {
            code: options?.code ?? 'INTERNAL_ERROR',
            message,
        },
    };
}

/**
 * Log the original error server-side while returning sanitized version
 *
 * @param error - The original error
 * @param context - Context for logging
 * @returns Sanitized message for client
 */
export function logAndSanitize(
    error: unknown,
    context: {
        operation: string;
        userId?: string;
        restaurantId?: string;
        requestId?: string;
    }
): string {
    // Log full error server-side
    console.error('[Error]', {
        operation: context.operation,
        userId: context.userId,
        restaurantId: context.restaurantId,
        requestId: context.requestId,
        error:
            error instanceof Error
                ? {
                      name: error.name,
                      message: error.message,
                      stack: error.stack,
                  }
                : error,
    });

    // Return sanitized message
    return sanitizeErrorMessage(error, { operation: context.operation });
}
