import { describe, expect, it, vi } from 'vitest';
import {
    getApiVersionInfo,
    parseVersionFromHeader,
    hasExplicitVersionHeader,
    getVersionedHeaders,
    getDeprecationHeaders,
    processApiVersion,
    isSupportedVersion,
    getLatestVersion,
    detectApiVersion,
} from '@/lib/api/versioning';
import { NextRequest } from 'next/server';

describe('API versioning', () => {
    describe('getApiVersionInfo', () => {
        it('should return v1 info', () => {
            const info = getApiVersionInfo('v1');
            expect(info.version).toBe('v1');
            expect(info.deprecated).toBe(false);
            expect(info.docsUrl).toBe('/docs/api/v1');
        });

        it('should default to v1 when no version provided', () => {
            const info = getApiVersionInfo();
            expect(info.version).toBe('v1');
        });
    });

    describe('parseVersionFromHeader', () => {
        it('should return null for null header', () => {
            expect(parseVersionFromHeader(null)).toBeNull();
        });

        it('should parse v1 from vendor header', () => {
            expect(parseVersionFromHeader('application/vnd.gebeta.v1+json')).toBe('v1');
        });

        it('should return null for unsupported version', () => {
            expect(parseVersionFromHeader('application/vnd.gebeta.v2+json')).toBeNull();
        });

        it('should return null for plain json header', () => {
            expect(parseVersionFromHeader('application/json')).toBeNull();
        });

        it('should return null for empty string', () => {
            expect(parseVersionFromHeader('')).toBeNull();
        });
    });

    describe('detectApiVersion', () => {
        it('should detect version from Accept header', () => {
            const req = new NextRequest(new URL('http://localhost/api/orders'), {
                headers: { accept: 'application/vnd.gebeta.v1+json' },
            });
            expect(detectApiVersion(req)).toBe('v1');
        });

        it('should detect version from URL path', () => {
            const req = new NextRequest(new URL('http://localhost/api/v1/orders'));
            expect(detectApiVersion(req)).toBe('v1');
        });

        it('should default to v1 when no version info', () => {
            const req = new NextRequest(new URL('http://localhost/api/orders'));
            expect(detectApiVersion(req)).toBe('v1');
        });

        it('should prefer header over URL path', () => {
            const req = new NextRequest(new URL('http://localhost/api/v2/orders'), {
                headers: { accept: 'application/vnd.gebeta.v1+json' },
            });
            expect(detectApiVersion(req)).toBe('v1');
        });

        it('should default to v1 for unsupported URL version', () => {
            const req = new NextRequest(new URL('http://localhost/api/v99/orders'));
            expect(detectApiVersion(req)).toBe('v1');
        });
    });

    describe('hasExplicitVersionHeader', () => {
        it('should return true when vendor header is present', () => {
            const req = new NextRequest(new URL('http://localhost/api/orders'), {
                headers: { accept: 'application/vnd.gebeta.v1+json' },
            });
            expect(hasExplicitVersionHeader(req)).toBe(true);
        });

        it('should return false when no accept header', () => {
            const req = new NextRequest(new URL('http://localhost/api/orders'));
            expect(hasExplicitVersionHeader(req)).toBe(false);
        });

        it('should return false for plain json accept header', () => {
            const req = new NextRequest(new URL('http://localhost/api/orders'), {
                headers: { accept: 'application/json' },
            });
            expect(hasExplicitVersionHeader(req)).toBe(false);
        });
    });

    describe('getVersionedHeaders', () => {
        it('should return versioned headers for v1', () => {
            const headers = getVersionedHeaders('v1');
            expect(headers['API-Version']).toBe('v1');
            expect(headers['X-API-Version']).toBe('v1');
            expect(headers['Content-Type']).toBe('application/vnd.gebeta.v1+json');
        });

        it('should default to v1', () => {
            const headers = getVersionedHeaders();
            expect(headers['API-Version']).toBe('v1');
        });
    });

    describe('getDeprecationHeaders', () => {
        it('should return deprecation headers', () => {
            const headers = getDeprecationHeaders('2025-12-31', '/docs/api/v1');
            expect(headers.Deprecation).toBe('Sunset="2025-12-31"');
            expect(headers.Link).toBe('</docs/api/v1>; rel="deprecation"');
        });
    });

    describe('processApiVersion', () => {
        it('should return version and redirect info for unversioned API route', () => {
            const req = new NextRequest(new URL('http://localhost/api/orders'));
            const result = processApiVersion(req);
            expect(result.version).toBe('v1');
            expect(result.shouldRedirect).toBe(false);
            expect(result.isExplicitVersion).toBe(false);
        });

        it('should detect explicit version header', () => {
            const req = new NextRequest(new URL('http://localhost/api/orders'), {
                headers: { accept: 'application/vnd.gebeta.v1+json' },
            });
            const result = processApiVersion(req);
            expect(result.isExplicitVersion).toBe(true);
        });

        it('should handle versioned URL path', () => {
            const req = new NextRequest(new URL('http://localhost/api/v1/orders'));
            const result = processApiVersion(req);
            expect(result.version).toBe('v1');
            expect(result.shouldRedirect).toBe(false);
        });

        it('should not redirect for non-API routes', () => {
            const req = new NextRequest(new URL('http://localhost/dashboard'));
            const result = processApiVersion(req);
            expect(result.shouldRedirect).toBe(false);
        });
    });

    describe('isSupportedVersion', () => {
        it('should return true for v1', () => {
            expect(isSupportedVersion('v1')).toBe(true);
        });

        it('should return false for unsupported version', () => {
            expect(isSupportedVersion('v2')).toBe(false);
        });

        it('should return false for empty string', () => {
            expect(isSupportedVersion('')).toBe(false);
        });
    });

    describe('getLatestVersion', () => {
        it('should return v1', () => {
            expect(getLatestVersion()).toBe('v1');
        });
    });
});
