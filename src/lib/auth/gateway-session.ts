import { createHmac, timingSafeEqual } from 'crypto';
import type { DeviceProfile, HardwareDeviceType } from '@/lib/devices/config';
import type { GatewayCapability, OfflineStaffOutagePolicy } from '@/lib/auth/offline-authz';

export interface GatewaySessionClaims {
    deviceId: string;
    restaurantId: string;
    locationId: string;
    gatewayId: string;
    deviceType: HardwareDeviceType;
    deviceProfile: DeviceProfile | null;
    identityVersion: number;
    authorizations: GatewayCapability[];
    topicPrefix: string;
    issuedAt: string;
    expiresAt: string;
    offlineAccessExpiresAt: string;
    staffOutagePolicy: OfflineStaffOutagePolicy;
}

export interface GatewaySessionBundle {
    token: string;
    claims: GatewaySessionClaims;
    username: string;
    password: string;
}

function getGatewaySessionSecret(): string {
    const configuredSecret =
        process.env.GATEWAY_SESSION_SECRET ||
        process.env.DEVICE_TOKEN_SIGNATURE_SECRET ||
        process.env.AUTH_SECRET;

    if (configuredSecret) {
        return configuredSecret;
    }

    if (process.env.NODE_ENV === 'test') {
        return 'test-gateway-session-secret';
    }

    throw new Error('GATEWAY_SESSION_SECRET is required for gateway session issuance');
}

function toBase64Url(value: string): string {
    return Buffer.from(value, 'utf8').toString('base64url');
}

function signPayload(payload: string): string {
    return createHmac('sha256', getGatewaySessionSecret()).update(payload).digest('base64url');
}

export function issueGatewaySessionToken(input: {
    deviceId: string;
    restaurantId: string;
    locationId: string;
    gatewayId: string;
    deviceType?: HardwareDeviceType;
    deviceProfile?: DeviceProfile | null;
    identityVersion?: number;
    authorizations?: GatewayCapability[];
    expiresInMinutes?: number;
    offlineAccessExpiresAt?: string;
    staffOutagePolicy?: OfflineStaffOutagePolicy;
}): GatewaySessionBundle {
    const issuedAt = new Date();
    const expiresAt = new Date(issuedAt.getTime() + (input.expiresInMinutes ?? 60) * 60 * 1000);
    const claims: GatewaySessionClaims = {
        deviceId: input.deviceId,
        restaurantId: input.restaurantId,
        locationId: input.locationId,
        gatewayId: input.gatewayId,
        deviceType: input.deviceType ?? 'pos',
        deviceProfile: input.deviceProfile ?? null,
        identityVersion: input.identityVersion ?? 1,
        authorizations: input.authorizations ?? ['gateway.bootstrap'],
        topicPrefix: `lole/v1/restaurants/${input.restaurantId}/locations/${input.locationId}`,
        issuedAt: issuedAt.toISOString(),
        expiresAt: expiresAt.toISOString(),
        offlineAccessExpiresAt: input.offlineAccessExpiresAt ?? expiresAt.toISOString(),
        staffOutagePolicy: input.staffOutagePolicy ?? {
            mode: 'blocked',
            ttlMinutes: 0,
            requiresRecentPin: false,
            allowedRoles: [],
        },
    };

    const encodedClaims = toBase64Url(JSON.stringify(claims));
    const signature = signPayload(encodedClaims);
    const token = `${encodedClaims}.${signature}`;

    return {
        token,
        claims,
        username: input.deviceId,
        password: token,
    };
}

export function verifyGatewaySessionToken(token: string): GatewaySessionClaims | null {
    const [encodedClaims, providedSignature] = token.split('.');
    if (!encodedClaims || !providedSignature) {
        return null;
    }

    let expectedSignature: string;
    try {
        expectedSignature = signPayload(encodedClaims);
    } catch {
        return null;
    }
    const expectedBuffer = Buffer.from(expectedSignature, 'utf8');
    const providedBuffer = Buffer.from(providedSignature, 'utf8');

    if (
        expectedBuffer.length !== providedBuffer.length ||
        !timingSafeEqual(expectedBuffer, providedBuffer)
    ) {
        return null;
    }

    try {
        const claims = JSON.parse(
            Buffer.from(encodedClaims, 'base64url').toString('utf8')
        ) as GatewaySessionClaims;
        if (new Date(claims.expiresAt).getTime() < Date.now()) {
            return null;
        }

        return claims;
    } catch {
        return null;
    }
}
