/**
 * Session Management
 *
 * Addresses PLATFORM_AUDIT_REPORT finding SEC-H2: No Session Timeout
 * Implements secure session management with timeout and activity tracking
 */

const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const ACTIVITY_THRESHOLD = 5 * 60 * 1000; // Check every 5 minutes

interface SessionData {
    userId: string;
    lastActivity: number;
    createdAt: number;
    ipAddress: string;
    userAgent: string;
}

// In-memory session store (use Redis in production)
const sessions = new Map<string, SessionData>();

/**
 * Create a new session
 */
export function createSession(
    sessionId: string,
    userId: string,
    ipAddress: string,
    userAgent: string
): void {
    const now = Date.now();
    sessions.set(sessionId, {
        userId,
        lastActivity: now,
        createdAt: now,
        ipAddress,
        userAgent,
    });
}

/**
 * Update session activity
 */
export function updateSessionActivity(sessionId: string): boolean {
    const session = sessions.get(sessionId);
    if (!session) return false;

    session.lastActivity = Date.now();
    return true;
}

/**
 * Validate session - checks if session exists and hasn't expired
 */
export function validateSession(sessionId: string): { valid: boolean; reason?: string } {
    const session = sessions.get(sessionId);

    if (!session) {
        return { valid: false, reason: 'Session not found' };
    }

    const now = Date.now();

    // Check if session has expired due to inactivity
    if (now - session.lastActivity > SESSION_TIMEOUT) {
        sessions.delete(sessionId);
        return { valid: false, reason: 'Session expired due to inactivity' };
    }

    // Check if session has exceeded max lifetime (8 hours)
    if (now - session.createdAt > 8 * 60 * 60 * 1000) {
        sessions.delete(sessionId);
        return { valid: false, reason: 'Session exceeded maximum lifetime' };
    }

    // Update last activity
    session.lastActivity = now;

    return { valid: true };
}

/**
 * Get session data
 */
export function getSession(sessionId: string): SessionData | null {
    return sessions.get(sessionId) || null;
}

/**
 * Destroy session (logout)
 */
export function destroySession(sessionId: string): void {
    sessions.delete(sessionId);
}

/**
 * Get time until session expires
 */
export function getSessionTimeRemaining(sessionId: string): number {
    const session = sessions.get(sessionId);
    if (!session) return 0;

    const expiresAt = session.lastActivity + SESSION_TIMEOUT;
    return Math.max(0, expiresAt - Date.now());
}

/**
 * Clean up expired sessions
 */
export function cleanupExpiredSessions(): number {
    const now = Date.now();
    let cleaned = 0;

    for (const [sessionId, session] of sessions.entries()) {
        if (
            now - session.lastActivity > SESSION_TIMEOUT ||
            now - session.createdAt > 8 * 60 * 60 * 1000
        ) {
            sessions.delete(sessionId);
            cleaned++;
        }
    }

    return cleaned;
}

// Auto-cleanup every 5 minutes
setInterval(cleanupExpiredSessions, ACTIVITY_THRESHOLD);

/**
 * Check if session is from the same device/IP
 * (Basic fraud detection)
 */
export function validateSessionContext(
    sessionId: string,
    ipAddress: string,
    userAgent: string
): { valid: boolean; reason?: string } {
    const session = sessions.get(sessionId);
    if (!session) {
        return { valid: false, reason: 'Session not found' };
    }

    // Check if IP has changed (could indicate session hijacking)
    if (session.ipAddress !== ipAddress) {
        // In production, you might want to invalidate the session
        // or require re-authentication
        console.warn(`Session ${sessionId} IP mismatch: ${session.ipAddress} vs ${ipAddress}`);
    }

    // Check if user agent has changed significantly
    if (session.userAgent !== userAgent) {
        console.warn(`Session ${sessionId} User-Agent mismatch`);
    }

    return { valid: true };
}

/**
 * Extend session timeout
 * Call this when user performs an action to keep session alive
 */
export function extendSession(sessionId: string): boolean {
    const session = sessions.get(sessionId);
    if (!session) return false;

    // Only extend if session is still valid
    const validation = validateSession(sessionId);
    if (!validation.valid) return false;

    session.lastActivity = Date.now();
    return true;
}
