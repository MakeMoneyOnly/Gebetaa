/**
 * CSRF (Cross-Site Request Forgery) Protection
 *
 * Addresses COMPREHENSIVE_CODEBASE_AUDIT_REPORT Section 3.5
 * Implements CSRF token generation and validation for Server Actions
 */

import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

/**
 * CSRF token configuration
 */
const CSRF_TOKEN_NAME = 'csrf_token';
const CSRF_HEADER_NAME = 'x-csrf-token';
const CSRF_COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    path: '/',
    maxAge: 60 * 60 * 24, // 24 hours
};

/**
 * Generate a cryptographically secure random token
 */
export function generateCsrfToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Create a hash of the token for comparison
 * Uses SubtleCrypto API for security
 */
async function hashToken(token: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(token);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Set CSRF token in cookie and return the token
 * Call this when rendering a form or page with actions
 */
export async function setCsrfToken(): Promise<string> {
    const cookieStore = await cookies();
    const token = generateCsrfToken();
    const hashedToken = await hashToken(token);

    cookieStore.set(CSRF_TOKEN_NAME, hashedToken, CSRF_COOKIE_OPTIONS);

    return token;
}

/**
 * Get the current CSRF token from cookies (hashed)
 */
export async function getCsrfTokenFromCookie(): Promise<string | null> {
    const cookieStore = await cookies();
    return cookieStore.get(CSRF_TOKEN_NAME)?.value || null;
}

/**
 * Validate CSRF token from request
 * Compares the token from header/form with the hashed token in cookie
 */
export async function validateCsrfToken(
    providedToken: string | null | undefined
): Promise<{ valid: boolean; reason?: string }> {
    if (!providedToken) {
        return { valid: false, reason: 'CSRF token missing' };
    }

    const storedHashedToken = await getCsrfTokenFromCookie();

    if (!storedHashedToken) {
        return { valid: false, reason: 'CSRF token not found in session' };
    }

    const providedHashedToken = await hashToken(providedToken);

    if (providedHashedToken !== storedHashedToken) {
        return { valid: false, reason: 'CSRF token mismatch' };
    }

    return { valid: true };
}

/**
 * Extract CSRF token from request
 * Checks header first, then falls back to body
 */
export function extractCsrfToken(request: NextRequest): string | null {
    // Check header first
    const headerToken = request.headers.get(CSRF_HEADER_NAME);
    if (headerToken) return headerToken;

    // For form submissions, we'd need to parse the body
    // This is handled separately in form validation
    return null;
}

/**
 * CSRF validation middleware for API routes
 */
export async function csrfMiddleware(
    request: NextRequest
): Promise<NextResponse | null> {
    // Skip CSRF for GET, HEAD, OPTIONS
    if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
        return null;
    }

    const token = extractCsrfToken(request);
    const validation = await validateCsrfToken(token);

    if (!validation.valid) {
        return NextResponse.json(
            {
                error: 'CSRF validation failed',
                code: 'CSRF_ERROR',
                reason: validation.reason,
            },
            { status: 403 }
        );
    }

    return null;
}

/**
 * Higher-order function to wrap Server Actions with CSRF protection
 *
 * Usage:
 * ```typescript
 * 'use server';
 *
 * import { withCsrfProtection } from '@/lib/security/csrf';
 *
 * export const myAction = withCsrfProtection(async (data: FormData) => {
 *   // Your action logic
 * });
 * ```
 */
export function withCsrfProtection<TArgs extends unknown[], TResult>(
    action: (...args: TArgs) => Promise<TResult>
): (...args: TArgs) => Promise<TResult> {
    return async (...args: TArgs): Promise<TResult> => {
        // For server actions, we expect the first argument might contain formData
        // or a separate CSRF token argument
        const formData = args.find(
            (arg) => arg instanceof FormData
        ) as FormData | undefined;

        let csrfToken: string | null = null;

        if (formData) {
            csrfToken = formData.get('_csrf') as string | null;
        }

        // Also check if a token was passed directly
        const tokenArg = args.find(
            (arg) => typeof arg === 'object' && arg !== null && '_csrf' in arg
        ) as { _csrf?: string } | undefined;

        if (tokenArg?._csrf) {
            csrfToken = tokenArg._csrf;
        }

        const validation = await validateCsrfToken(csrfToken);

        if (!validation.valid) {
            throw new Error(`CSRF validation failed: ${validation.reason}`);
        }

        return action(...args);
    };
}

/**
 * Create a CSRF token input for forms
 * Use this in Server Components when rendering forms
 *
 * Usage:
 * ```tsx
 * import { getCsrfInput } from '@/lib/security/csrf';
 *
 * export default async function MyForm() {
 *   const csrfInput = await getCsrfInput();
 *   return (
 *     <form action={submitAction}>
 *       <input {...csrfInput} />
 *       // other inputs
 *     </form>
 *   );
 * }
 * ```
 */
export async function getCsrfInput(): Promise<{
    type: 'hidden';
    name: '_csrf';
    defaultValue: string;
}> {
    const token = await setCsrfToken();
    return {
        type: 'hidden' as const,
        name: '_csrf',
        defaultValue: token,
    };
}

/**
 * Regenerate CSRF token after sensitive operations
 * Prevents token reuse attacks
 */
export async function regenerateCsrfToken(): Promise<string> {
    const cookieStore = await cookies();
    const newToken = generateCsrfToken();
    const hashedToken = await hashToken(newToken);

    cookieStore.set(CSRF_TOKEN_NAME, hashedToken, CSRF_COOKIE_OPTIONS);

    return newToken;
}

/**
 * Clear CSRF token (on logout)
 */
export async function clearCsrfToken(): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.delete(CSRF_TOKEN_NAME);
}

export default {
    generateCsrfToken,
    setCsrfToken,
    validateCsrfToken,
    withCsrfProtection,
    getCsrfInput,
    regenerateCsrfToken,
    clearCsrfToken,
};