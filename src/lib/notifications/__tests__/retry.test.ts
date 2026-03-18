import { describe, it, expect } from 'vitest';
import { calculateNextRetry, shouldRetry, getDelayForRetry, RETRY_CONFIG } from '../retry';

describe('RETRY_CONFIG', () => {
    it('should have correct default values', () => {
        expect(RETRY_CONFIG.DEFAULT_MAX_RETRIES).toBe(3);
        expect(RETRY_CONFIG.BASE_DELAY_MS).toBe(60000); // 60 seconds
        expect(RETRY_CONFIG.BACKOFF_MULTIPLIER).toBe(2);
        expect(RETRY_CONFIG.MAX_DELAY_MS).toBe(3600000); // 3600 seconds = 1 hour
        expect(RETRY_CONFIG.JITTER_FACTOR).toBe(0.1);
    });
});

describe('calculateNextRetry', () => {
    it('should calculate next retry time with exponential backoff', () => {
        const baseDelay = 60000; // 60 seconds

        // First retry: 60s * 2^0 = 60s (capped at max)
        const nextRetry1 = calculateNextRetry(0, baseDelay);
        const expectedMin1 = Date.now() + 60000 * 0.9; // accounting for jitter
        expect(nextRetry1.getTime()).toBeGreaterThan(expectedMin1);

        // Second retry: 60s * 2^1 = 120s
        const nextRetry2 = calculateNextRetry(1, baseDelay);
        const expectedMin2 = Date.now() + 120000 * 0.9;
        expect(nextRetry2.getTime()).toBeGreaterThan(expectedMin2);

        // Third retry: 60s * 2^2 = 240s
        const nextRetry3 = calculateNextRetry(2, baseDelay);
        const expectedMin3 = Date.now() + 240000 * 0.9;
        expect(nextRetry3.getTime()).toBeGreaterThan(expectedMin3);
    });

    it('should cap delay at max delay', () => {
        const baseDelay = 60000;

        // With high retry count, should cap at MAX_DELAY_MS
        const nextRetry = calculateNextRetry(10, baseDelay);
        const maxDelay = RETRY_CONFIG.MAX_DELAY_MS;

        // Should be within max delay plus jitter
        const timeUntilRetry = nextRetry.getTime() - Date.now();
        expect(timeUntilRetry).toBeLessThanOrEqual(maxDelay * 1.1); // +10% for jitter
    });

    it('should add jitter to prevent thundering herd', () => {
        const baseDelay = 60000;
        const results: number[] = [];

        // Generate multiple results to check for jitter variance
        for (let i = 0; i < 10; i++) {
            const nextRetry = calculateNextRetry(0, baseDelay);
            results.push(nextRetry.getTime() - Date.now());
        }

        // Results should have some variance (jitter)
        const uniqueResults = new Set(results.map(r => Math.round(r / 1000)));
        expect(uniqueResults.size).toBeGreaterThan(1);
    });

    it('should return future date', () => {
        const now = Date.now();
        const nextRetry = calculateNextRetry(0, 60000);
        expect(nextRetry.getTime()).toBeGreaterThan(now);
    });
});

describe('shouldRetry', () => {
    const maxRetries = 3;

    it('should return true when retry count is less than max', () => {
        expect(shouldRetry(0, maxRetries)).toBe(true);
        expect(shouldRetry(1, maxRetries)).toBe(true);
        expect(shouldRetry(2, maxRetries)).toBe(true);
    });

    it('should return false when retry count equals max', () => {
        expect(shouldRetry(3, maxRetries)).toBe(false);
    });

    it('should return false when retry count exceeds max', () => {
        expect(shouldRetry(4, maxRetries)).toBe(false);
        expect(shouldRetry(10, maxRetries)).toBe(false);
    });

    it('should work with custom maxRetries', () => {
        expect(shouldRetry(0, 5)).toBe(true);
        expect(shouldRetry(5, 5)).toBe(false);
    });

    it('should handle zero maxRetries', () => {
        expect(shouldRetry(0, 0)).toBe(false);
    });

    it('should handle edge case of negative maxRetries', () => {
        // With negative maxRetries, shouldRetry always returns false since retryCount >= 0
        expect(shouldRetry(0, -1)).toBe(false);
    });
});

describe('getDelayForRetry', () => {
    const baseDelay = 60000; // 60 seconds

    it('should return base delay for first retry', () => {
        expect(getDelayForRetry(0, baseDelay)).toBe(60000);
    });

    it('should double delay for each retry', () => {
        expect(getDelayForRetry(1, baseDelay)).toBe(120000);
        expect(getDelayForRetry(2, baseDelay)).toBe(240000);
        expect(getDelayForRetry(3, baseDelay)).toBe(480000);
    });

    it('should cap at max delay', () => {
        // Even with high retry count, should cap at MAX_DELAY_MS
        expect(getDelayForRetry(10, baseDelay)).toBe(RETRY_CONFIG.MAX_DELAY_MS);
        expect(getDelayForRetry(100, baseDelay)).toBe(RETRY_CONFIG.MAX_DELAY_MS);
    });

    it('should handle zero baseDelay', () => {
        expect(getDelayForRetry(0, 0)).toBe(0);
    });

    it('should verify exponential growth pattern', () => {
        const baseDelay = 1000;
        const delays = [
            getDelayForRetry(0, baseDelay),
            getDelayForRetry(1, baseDelay),
            getDelayForRetry(2, baseDelay),
            getDelayForRetry(3, baseDelay),
        ];

        // Each delay should be roughly double the previous
        expect(delays[1]).toBeCloseTo(delays[0] * 2, 5);
        expect(delays[2]).toBeCloseTo(delays[1] * 2, 5);
        expect(delays[3]).toBeCloseTo(delays[2] * 2, 5);
    });
});

describe('Retry configuration integration', () => {
    it('should have consistent multiplier in all functions', () => {
        const baseDelay = RETRY_CONFIG.BASE_DELAY_MS;

        // The backoff calculation should be consistent
        const delay0 = getDelayForRetry(0, baseDelay);
        const delay1 = getDelayForRetry(1, baseDelay);

        expect(delay1).toBe(delay0 * RETRY_CONFIG.BACKOFF_MULTIPLIER);
    });

    it('should respect max delay boundary', () => {
        const baseDelay = RETRY_CONFIG.BASE_DELAY_MS;
        const maxDelay = RETRY_CONFIG.MAX_DELAY_MS;

        // At some retry count, should hit max
        let retryCount = 0;
        let delay = 0;
        while (delay < maxDelay && retryCount < 20) {
            delay = getDelayForRetry(retryCount, baseDelay);
            retryCount++;
        }

        // Should eventually cap at max
        expect(retryCount).toBeLessThan(20);
    });
});
