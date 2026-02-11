import { createHmac, timingSafeEqual } from 'crypto';

/**
 * HMAC Utilities for QR Code Signing
 *
 * Addresses PLATFORM_AUDIT_REPORT finding SEC-H6: HMAC-signed QR codes
 * Ensures QR codes are authentic and haven't been tampered with
 */

const HMAC_SECRET =
    process.env.QR_HMAC_SECRET ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
    'default-secret-change-in-production';

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

    const url = new URL(
        `${process.env.NEXT_PUBLIC_APP_URL || 'https://gebetamenu.com'}/${restaurantSlug}`
    );
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

    // Verify signature
    const data = `${restaurantSlug}:${tableNumber}:${expiresAt}`;
    if (!verifyQRSignature(data, signature)) {
        return { valid: false, reason: 'Invalid signature' };
    }

    return { valid: true };
}
