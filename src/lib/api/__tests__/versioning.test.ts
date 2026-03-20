/**
 * API Versioning Tests
 *
 * Tests for the API versioning utilities
 */

import { describe, it, expect } from 'vitest';
import {
    parseVersionFromHeader,
    detectApiVersion,
    hasExplicitVersionHeader,
    getVersionedHeaders,
    getApiVersionInfo,
    isSupportedVersion,
    getLatestVersion,
    SUPPORTED_API_VERSIONS,
} from '../versioning';
import { NextRequest } from 'next/server';

// Helper to create mock NextRequest
function createMockRequest(options: {
    url?: string;
    headers?: Record<string, string>;
}): NextRequest {
    const url = options.url || 'http://localhost:3000/api/orders';
    const headers = options.headers || {};

    // Create a mock request-like object
    const mockHeaders = new Map<string, string>();
    for (const [key, value] of Object.entries(headers)) {
        mockHeaders.set(key, value);
    }

    return {
        url,
        nextUrl: new URL(url),
        headers: {
            get: (key: string) => mockHeaders.get(key) || null,
            entries: () => mockHeaders.entries(),
        },
    } as unknown as NextRequest;
}

describe('parseVersionFromHeader', () => {
    it('should return v1 for explicit v1 header', () => {
        expect(parseVersionFromHeader('application/vnd.gebeta.v1+json')).toBe('v1');
    });

    it('should return null for generic json header', () => {
        expect(parseVersionFromHeader('application/json')).toBeNull();
    });

    it('should return null for null header', () => {
        expect(parseVersionFromHeader(null)).toBeNull();
    });

    it('should return null for unsupported version', () => {
        expect(parseVersionFromHeader('application/vnd.gebeta.v2+json')).toBeNull();
    });

    it('should return null for invalid header format', () => {
        expect(parseVersionFromHeader('text/html')).toBeNull();
    });
});

describe('detectApiVersion', () => {
    it('should detect version from Accept header', () => {
        const request = createMockRequest({
            url: 'http://localhost:3000/api/orders',
            headers: { accept: 'application/vnd.gebeta.v1+json' },
        });
        expect(detectApiVersion(request)).toBe('v1');
    });

    it('should detect version from URL path', () => {
        const request = createMockRequest({
            url: 'http://localhost:3000/api/v1/orders',
        });
        expect(detectApiVersion(request)).toBe('v1');
    });

    it('should default to v1 when no version specified', () => {
        const request = createMockRequest({
            url: 'http://localhost:3000/api/orders',
        });
        expect(detectApiVersion(request)).toBe('v1');
    });

    it('should prefer header over URL path', () => {
        const request = createMockRequest({
            url: 'http://localhost:3000/api/v1/orders',
            headers: { accept: 'application/vnd.gebeta.v1+json' },
        });
        expect(detectApiVersion(request)).toBe('v1');
    });

    it('should return v1 for unsupported URL version', () => {
        const request = createMockRequest({
            url: 'http://localhost:3000/api/v99/orders',
        });
        expect(detectApiVersion(request)).toBe('v1');
    });
});

describe('hasExplicitVersionHeader', () => {
    it('should return true for explicit version header', () => {
        const request = createMockRequest({
            headers: { accept: 'application/vnd.gebeta.v1+json' },
        });
        expect(hasExplicitVersionHeader(request)).toBe(true);
    });

    it('should return false for generic json header', () => {
        const request = createMockRequest({
            headers: { accept: 'application/json' },
        });
        expect(hasExplicitVersionHeader(request)).toBe(false);
    });

    it('should return false for null header', () => {
        const request = createMockRequest({});
        expect(hasExplicitVersionHeader(request)).toBe(false);
    });
});

describe('getVersionedHeaders', () => {
    it('should return version headers for v1', () => {
        const headers = getVersionedHeaders('v1');
        expect(headers).toEqual({
            'API-Version': 'v1',
            'Content-Type': 'application/vnd.gebeta.v1+json',
            'X-API-Version': 'v1',
        });
    });
});

describe('getApiVersionInfo', () => {
    it('should return version info for v1', () => {
        const info = getApiVersionInfo('v1');
        expect(info).toEqual({
            version: 'v1',
            deprecated: false,
            docsUrl: '/docs/api/v1',
        });
    });

    it('should return default version info for unknown version', () => {
        const info = getApiVersionInfo('v99' as never);
        expect(info.version).toBe('v1');
    });
});

describe('isSupportedVersion', () => {
    it('should return true for v1', () => {
        expect(isSupportedVersion('v1')).toBe(true);
    });

    it('should return false for unsupported versions', () => {
        expect(isSupportedVersion('v2')).toBe(false);
        expect(isSupportedVersion('v0')).toBe(false);
    });
});

describe('getLatestVersion', () => {
    it('should return v1 as latest version', () => {
        expect(getLatestVersion()).toBe('v1');
    });
});

describe('SUPPORTED_API_VERSIONS', () => {
    it('should include v1', () => {
        expect(SUPPORTED_API_VERSIONS).toContain('v1');
    });
});
