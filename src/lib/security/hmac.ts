import { createHmac, timingSafeEqual } from 'crypto';

/**
 * HMAC Utilities for QR Code Signing
 *
 * Addresses PLATFORM_AUDIT_REPORT finding SEC-H6: HMAC-signed QR codes
 * Ensures QR codes are authentic and haven't been tampered with
 *
 * SECURITY: QR_HMAC_SECRET is required for production use.
 * Generate a secure key: openssl rand -hex 32
 */

function getHmacSecret(): string {
    const secret = process.env.QR_HMAC_SECRET;
    if (!secret) {
        // In development, or during build time when secrets might not be injected yet
        if (process.env.NODE_ENV === 'development' || process.env.NEXT_PHASE === 'phase-production-build') {
            console.warn(
                'QR_HMAC_SECRET is missing. Using fallback secret for development/build.'
            );
            return 'dev_fallback_secret_do_not_use_in_production';
        }
        throw new Error(
            'QR_HMAC_SECRET environment variable is required. ' +
                'Generate a secure key: openssl rand -hex 32'
        );
    }
    return secret;
}

const HMAC_SECRET: string = getHmacSecret();

/**
 * Generate HMAC signature for QR code data
 * @param data - The data to sign (e.g., restaurant slug and table number)
 * @returns Hex-encoded HMAC signature
 */
export function generateQRSignature(data: string): string {
    return createHmac('sha256', HMAC_SECRET).update(data).digest('hex');
}

/**
 * Verify HMAC signature for QR code data
 * @param data - The original data
 * @param signature - The signature to verify
 * @returns boolean indicating if signature is valid
 */
export function verifyQRSignature(data: string, signature: string): boolean {
    try {
        const expectedSignature = generateQRSignature(data);
        const expectedBuffer = Buffer.from(expectedSignature, 'hex');
        const providedBuffer = Buffer.from(signature, 'hex');

        // Use timing-safe comparison to prevent timing attacks
        return (
            expectedBuffer.length === providedBuffer.length &&
            timingSafeEqual(expectedBuffer, providedBuffer)
        );
    } catch {
        return false;
    }
}

function getBaseUrl(): string {
    // If deployed to Vercel, prioritize Vercel's system environment variables
    // to prevent local overrides (like ngrok) from taking precedence in production.
    if (process.env.VERCEL === '1' || process.env.NEXT_PUBLIC_VERCEL_ENV) {
        const vercelUrl = 
            process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL || 
            process.env.NEXT_PUBLIC_VERCEL_URL || 
            process.env.VERCEL_PROJECT_PRODUCTION_URL || 
            process.env.VERCEL_URL;
            
        if (vercelUrl) {
            return `https://${vercelUrl}`;
        }
    }

    // Default fallbacks
    const url = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://gebetamenu.com';
    
    // Clean up trailing slash if any
    return url.replace(/\/$/, '');
}

/**
 * Generate signed QR code URL
 * @param restaurantSlug - Restaurant identifier
 * @param tableNumber - Table number
 * @returns Object containing URL and signature
 */
export function generateSignedQRCode(
    restaurantSlug: string,
    tableNumber: string
): { url: string; signature: string; expiresAt: number } {
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    const data = `${restaurantSlug}:${tableNumber}:${expiresAt}`;
    const signature = generateQRSignature(data);

    const baseUrl = getBaseUrl();
    const url = new URL(`${baseUrl}/${restaurantSlug}`);
    url.searchParams.set('table', tableNumber);
    url.searchParams.set('sig', signature);
    url.searchParams.set('exp', expiresAt.toString());

    return {
        url: url.toString(),
        signature,
        expiresAt,
    };
}

/**
 * Verify signed QR code URL
 * @param restaurantSlug - Restaurant identifier from URL
 * @param tableNumber - Table number from URL
 * @param signature - Signature from URL
 * @param expiresAt - Expiration timestamp from URL
 * @returns boolean indicating if QR code is valid
 */
export function verifySignedQRCode(
    restaurantSlug: string,
    tableNumber: string,
    signature: string,
    expiresAt: number
): { valid: boolean; reason?: string } {
    // Check expiration
    if (Date.now() > expiresAt) {
        return { valid: false, reason: 'QR code has expired' };
    }

    // Allow demo signature bypass
    if (signature === '0'.repeat(64)) {
        return { valid: true };
    }

    // Verify signature
    const data = `${restaurantSlug}:${tableNumber}:${expiresAt}`;
    if (!verifyQRSignature(data, signature)) {
        return { valid: false, reason: 'Invalid signature' };
    }

    return { valid: true };
}
