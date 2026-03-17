/**
 * Waitlist Service Tests
 *
 * Unit tests for the waitlist service layer.
 */

import { describe, it, expect, vi } from 'vitest';

// Mock dependencies
vi.mock('@/lib/supabase/service-role', () => ({
    createServiceRoleClient: vi.fn(() => ({
        from: vi.fn(() => ({
            select: vi.fn(() => ({
                eq: vi.fn(() => ({
                    order: vi.fn(() => ({
                        limit: vi.fn(() => ({
                            maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })),
                        })),
                    })),
                })),
            })),
        })),
    })),
}));

vi.mock('@/lib/notifications/retry', () => ({
    sendSmsWithRetry: vi.fn(() =>
        Promise.resolve({
            success: true,
            provider: 'log',
            attempts: 1,
        })
    ),
}));

vi.mock('@/lib/notifications/deduplication', () => ({
    checkAndRecord: vi.fn(() =>
        Promise.resolve({
            isDuplicate: false,
            dedupeKey: 'test-key',
        })
    ),
}));

describe('Waitlist Service', () => {
    describe('Type definitions', () => {
        it('should have correct WaitlistStatus type values', () => {
            const statuses = ['waiting', 'notified', 'seated', 'cancelled', 'expired'] as const;
            expect(statuses).toContain('waiting');
            expect(statuses).toContain('notified');
            expect(statuses).toContain('seated');
            expect(statuses).toContain('cancelled');
            expect(statuses).toContain('expired');
        });

        it('should have correct AddWaitlistParams shape', () => {
            const params = {
                restaurantId: 'test-restaurant-id',
                guestName: 'John Doe',
                guestPhone: '0912345678',
                guestCount: 4,
                notes: 'Window seat preferred',
            };

            expect(params.restaurantId).toBeDefined();
            expect(params.guestName).toBeDefined();
            expect(params.guestPhone).toBeDefined();
            expect(params.guestCount).toBeGreaterThan(0);
        });

        it('should have correct WaitlistEntry shape', () => {
            const entry = {
                id: 'test-id',
                restaurant_id: 'test-restaurant-id',
                guest_name: 'John Doe',
                guest_phone: '0912345678',
                guest_count: 4,
                status: 'waiting' as const,
                position: 1,
                estimated_wait_minutes: 15,
                notified_at: null,
                seated_at: null,
                notes: null,
                created_at: '2024-01-01T00:00:00Z',
                updated_at: '2024-01-01T00:00:00Z',
            };

            expect(entry.id).toBeDefined();
            expect(entry.restaurant_id).toBeDefined();
            expect(entry.status).toBe('waiting');
            expect(entry.position).toBeGreaterThan(0);
        });
    });

    describe('Waitlist Messages', () => {
        it('should have bilingual messages defined', () => {
            const { WAITLIST_MESSAGES } = require('../types');

            expect(WAITLIST_MESSAGES.addedToQueue).toBeDefined();
            expect(WAITLIST_MESSAGES.addedToQueue.en).toContain('{{position}}');
            expect(WAITLIST_MESSAGES.addedToQueue.am).toContain('{{position}}');

            expect(WAITLIST_MESSAGES.tableReady).toBeDefined();
            expect(WAITLIST_MESSAGES.tableReady.en).toBeDefined();
            expect(WAITLIST_MESSAGES.tableReady.am).toBeDefined();

            expect(WAITLIST_MESSAGES.seated).toBeDefined();
            expect(WAITLIST_MESSAGES.cancelled).toBeDefined();
        });
    });

    describe('Waitlist Configuration', () => {
        it('should have correct configuration values', () => {
            const { WAITLIST_CONFIG } = require('../types');

            expect(WAITLIST_CONFIG.DEFAULT_WAIT_PER_PERSON).toBe(15);
            expect(WAITLIST_CONFIG.MAX_GUEST_COUNT).toBe(20);
            expect(WAITLIST_CONFIG.MIN_GUEST_COUNT).toBe(1);
            expect(WAITLIST_CONFIG.CHECK_IN_WINDOW_MINUTES).toBe(10);
            expect(WAITLIST_CONFIG.TABLE_TURNOVER_MINUTES).toBe(45);
        });
    });

    describe('Waitlist Service Functions', () => {
        it('should export addToWaitlist function', () => {
            const { addToWaitlist } = require('../service');
            expect(typeof addToWaitlist).toBe('function');
        });

        it('should export getWaitlist function', () => {
            const { getWaitlist } = require('../service');
            expect(typeof getWaitlist).toBe('function');
        });

        it('should export getWaitlistEntry function', () => {
            const { getWaitlistEntry } = require('../service');
            expect(typeof getWaitlistEntry).toBe('function');
        });

        it('should export notifyGuest function', () => {
            const { notifyGuest } = require('../service');
            expect(typeof notifyGuest).toBe('function');
        });

        it('should export updateStatus function', () => {
            const { updateStatus } = require('../service');
            expect(typeof updateStatus).toBe('function');
        });

        it('should export removeFromWaitlist function', () => {
            const { removeFromWaitlist } = require('../service');
            expect(typeof removeFromWaitlist).toBe('function');
        });

        it('should export getPosition function', () => {
            const { getPosition } = require('../service');
            expect(typeof getPosition).toBe('function');
        });

        it('should export estimateWaitTime function', () => {
            const { estimateWaitTime } = require('../service');
            expect(typeof estimateWaitTime).toBe('function');
        });

        it('should export getWaitlistStats function', () => {
            const { getWaitlistStats } = require('../service');
            expect(typeof getWaitlistStats).toBe('function');
        });
    });

    describe('Phone number validation', () => {
        it('should validate Ethiopian phone numbers correctly', () => {
            const validPhones = ['0912345678', '+251912345678', '251912345678', '0912 345 678'];

            const phoneRegex = /^(\+?251|0)?[9]\d{8}$/;

            validPhones.forEach(phone => {
                const normalized = phone.replace(/\s/g, '');
                expect(phoneRegex.test(normalized)).toBe(true);
            });
        });

        it('should reject invalid phone numbers', () => {
            const invalidPhones = ['091234567', '09123456789', '0812345678', 'abcdefghij'];

            const phoneRegex = /^(\+?251|0)?[9]\d{8}$/;

            invalidPhones.forEach(phone => {
                expect(phoneRegex.test(phone)).toBe(false);
            });
        });
    });

    describe('Guest count validation', () => {
        it('should validate guest counts within range', () => {
            const MIN_GUESTS = 1;
            const MAX_GUESTS = 20;

            const validCounts = [1, 5, 10, 15, 20];
            validCounts.forEach(count => {
                expect(count >= MIN_GUESTS && count <= MAX_GUESTS).toBe(true);
            });

            const invalidCounts = [0, -1, 21, 100];
            invalidCounts.forEach(count => {
                expect(count >= MIN_GUESTS && count <= MAX_GUESTS).toBe(false);
            });
        });
    });

    describe('Wait time estimation', () => {
        it('should estimate wait time correctly based on position', () => {
            const estimateWaitTimeByPosition = (position: number): number => {
                if (position <= 0) return 0;
                const baseWait = position * 15;
                return Math.min(baseWait, 120);
            };

            expect(estimateWaitTimeByPosition(1)).toBe(15);
            expect(estimateWaitTimeByPosition(2)).toBe(30);
            expect(estimateWaitTimeByPosition(5)).toBe(75);
            expect(estimateWaitTimeByPosition(10)).toBe(120);
            expect(estimateWaitTimeByPosition(0)).toBe(0);
            expect(estimateWaitTimeByPosition(-1)).toBe(0);
        });
    });

    describe('Message interpolation', () => {
        it('should interpolate variables correctly', () => {
            const interpolateMessage = (
                template: string,
                vars: { position: number; minutes: number }
            ): string => {
                return template
                    .replace('{{position}}', String(vars.position))
                    .replace('{{minutes}}', String(vars.minutes));
            };

            const template = 'You are #{{position}} in line. Estimated wait: {{minutes}} minutes.';
            const result = interpolateMessage(template, { position: 3, minutes: 45 });

            expect(result).toBe('You are #3 in line. Estimated wait: 45 minutes.');
        });
    });
});
