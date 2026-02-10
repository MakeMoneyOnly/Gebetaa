import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
    createSession,
    validateSession,
    getSession,
    destroySession,
    getSessionTimeRemaining,
    extendSession,
    validateSessionContext,
    cleanupExpiredSessions,
} from './session';

/**
 * Session Management Tests
 *
 * Addresses PLATFORM_AUDIT_REPORT finding SEC-H2: No Session Timeout
 */

describe('Session Management', () => {
    beforeEach(() => {
        // Clean up any existing sessions before each test
        cleanupExpiredSessions();
    });

    describe('createSession', () => {
        it('should create a new session', () => {
            createSession('session-123', 'user-456', '192.168.1.1', 'Mozilla/5.0');

            const session = getSession('session-123');
            expect(session).not.toBeNull();
            expect(session?.userId).toBe('user-456');
            expect(session?.ipAddress).toBe('192.168.1.1');
            expect(session?.userAgent).toBe('Mozilla/5.0');
        });

        it('should set lastActivity to current time', () => {
            const before = Date.now();
            createSession('session-123', 'user-456', '192.168.1.1', 'Mozilla/5.0');
            const after = Date.now();

            const session = getSession('session-123');
            expect(session?.lastActivity).toBeGreaterThanOrEqual(before);
            expect(session?.lastActivity).toBeLessThanOrEqual(after);
        });
    });

    describe('validateSession', () => {
        it('should return valid for active session', () => {
            createSession('session-123', 'user-456', '192.168.1.1', 'Mozilla/5.0');

            const result = validateSession('session-123');

            expect(result.valid).toBe(true);
        });

        it('should return invalid for non-existent session', () => {
            const result = validateSession('non-existent');

            expect(result.valid).toBe(false);
            expect(result.reason).toBe('Session not found');
        });

        it('should return invalid for expired session (inactivity)', () => {
            createSession('session-123', 'user-456', '192.168.1.1', 'Mozilla/5.0');

            // Fast-forward time by 31 minutes (beyond 30 min timeout)
            vi.useFakeTimers();
            vi.advanceTimersByTime(31 * 60 * 1000);

            const result = validateSession('session-123');

            expect(result.valid).toBe(false);
            expect(result.reason).toBe('Session expired due to inactivity');

            vi.useRealTimers();
        });

        it('should return invalid for session exceeding max lifetime', () => {
            createSession('session-123', 'user-456', '192.168.1.1', 'Mozilla/5.0');

            // Fast-forward time by 9 hours (beyond 8 hour max)
            vi.useFakeTimers();
            vi.advanceTimersByTime(9 * 60 * 60 * 1000);

            const result = validateSession('session-123');

            expect(result.valid).toBe(false);
            expect(result.reason).toBe('Session exceeded maximum lifetime');

            vi.useRealTimers();
        });

        it('should update lastActivity on validation', () => {
            createSession('session-123', 'user-456', '192.168.1.1', 'Mozilla/5.0');

            const beforeValidation = getSession('session-123')?.lastActivity;

            // Wait a bit
            vi.useFakeTimers();
            vi.advanceTimersByTime(1000);

            validateSession('session-123');

            const afterValidation = getSession('session-123')?.lastActivity;
            expect(afterValidation).toBeGreaterThan(beforeValidation!);

            vi.useRealTimers();
        });
    });

    describe('getSession', () => {
        it('should return session data', () => {
            createSession('session-123', 'user-456', '192.168.1.1', 'Mozilla/5.0');

            const session = getSession('session-123');

            expect(session).toEqual({
                userId: 'user-456',
                ipAddress: '192.168.1.1',
                userAgent: 'Mozilla/5.0',
                lastActivity: expect.any(Number),
                createdAt: expect.any(Number),
            });
        });

        it('should return null for non-existent session', () => {
            const session = getSession('non-existent');

            expect(session).toBeNull();
        });
    });

    describe('destroySession', () => {
        it('should remove session', () => {
            createSession('session-123', 'user-456', '192.168.1.1', 'Mozilla/5.0');
            expect(getSession('session-123')).not.toBeNull();

            destroySession('session-123');

            expect(getSession('session-123')).toBeNull();
        });

        it('should not throw for non-existent session', () => {
            expect(() => destroySession('non-existent')).not.toThrow();
        });
    });

    describe('getSessionTimeRemaining', () => {
        it('should return positive time for active session', () => {
            createSession('session-123', 'user-456', '192.168.1.1', 'Mozilla/5.0');

            const timeRemaining = getSessionTimeRemaining('session-123');

            expect(timeRemaining).toBeGreaterThan(0);
            expect(timeRemaining).toBeLessThanOrEqual(30 * 60 * 1000); // 30 minutes
        });

        it('should return 0 for non-existent session', () => {
            const timeRemaining = getSessionTimeRemaining('non-existent');

            expect(timeRemaining).toBe(0);
        });

        it('should return 0 for expired session', () => {
            createSession('session-123', 'user-456', '192.168.1.1', 'Mozilla/5.0');

            vi.useFakeTimers();
            vi.advanceTimersByTime(31 * 60 * 1000);

            const timeRemaining = getSessionTimeRemaining('session-123');

            expect(timeRemaining).toBe(0);

            vi.useRealTimers();
        });
    });

    describe('extendSession', () => {
        it('should extend session timeout', () => {
            createSession('session-123', 'user-456', '192.168.1.1', 'Mozilla/5.0');

            vi.useFakeTimers();
            vi.advanceTimersByTime(20 * 60 * 1000); // 20 minutes

            const beforeExtend = getSessionTimeRemaining('session-123');
            const extended = extendSession('session-123');
            const afterExtend = getSessionTimeRemaining('session-123');

            expect(extended).toBe(true);
            expect(afterExtend).toBeGreaterThan(beforeExtend);

            vi.useRealTimers();
        });

        it('should return false for non-existent session', () => {
            const extended = extendSession('non-existent');

            expect(extended).toBe(false);
        });

        it('should return false for expired session', () => {
            createSession('session-123', 'user-456', '192.168.1.1', 'Mozilla/5.0');

            vi.useFakeTimers();
            vi.advanceTimersByTime(31 * 60 * 1000); // Expire session

            const extended = extendSession('session-123');

            expect(extended).toBe(false);

            vi.useRealTimers();
        });
    });

    describe('validateSessionContext', () => {
        it('should return valid for matching context', () => {
            createSession('session-123', 'user-456', '192.168.1.1', 'Mozilla/5.0');

            const result = validateSessionContext('session-123', '192.168.1.1', 'Mozilla/5.0');

            expect(result.valid).toBe(true);
        });

        it('should warn but allow for IP mismatch', () => {
            createSession('session-123', 'user-456', '192.168.1.1', 'Mozilla/5.0');

            const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
            const result = validateSessionContext('session-123', '192.168.1.2', 'Mozilla/5.0');

            expect(result.valid).toBe(true);
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('IP mismatch'));

            consoleSpy.mockRestore();
        });

        it('should warn but allow for User-Agent mismatch', () => {
            createSession('session-123', 'user-456', '192.168.1.1', 'Mozilla/5.0');

            const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
            const result = validateSessionContext('session-123', '192.168.1.1', 'Chrome/90.0');

            expect(result.valid).toBe(true);
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('User-Agent mismatch'));

            consoleSpy.mockRestore();
        });

        it('should return invalid for non-existent session', () => {
            const result = validateSessionContext('non-existent', '192.168.1.1', 'Mozilla/5.0');

            expect(result.valid).toBe(false);
            expect(result.reason).toBe('Session not found');
        });
    });

    describe('cleanupExpiredSessions', () => {
        it('should remove expired sessions', () => {
            createSession('active-session', 'user-1', '192.168.1.1', 'Mozilla/5.0');
            createSession('expired-session', 'user-2', '192.168.1.1', 'Mozilla/5.0');

            vi.useFakeTimers();
            vi.advanceTimersByTime(31 * 60 * 1000); // Expire sessions

            // Create a new active session after expiration time
            createSession('new-session', 'user-3', '192.168.1.1', 'Mozilla/5.0');

            const cleaned = cleanupExpiredSessions();

            expect(cleaned).toBeGreaterThanOrEqual(2);
            expect(getSession('active-session')).toBeNull();
            expect(getSession('expired-session')).toBeNull();
            expect(getSession('new-session')).not.toBeNull();

            vi.useRealTimers();
        });

        it('should return 0 when no sessions to clean', () => {
            const cleaned = cleanupExpiredSessions();
            expect(cleaned).toBe(0);
        });
    });
});
