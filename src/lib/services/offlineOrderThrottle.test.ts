import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    getOnlineOrderingSettings,
    checkOrderThrottle,
    getEstimatedWaitTime,
} from './offlineOrderThrottle';

// Mock the supabase client
const mockSupabase = {
    from: vi.fn(),
};

vi.mock('@/lib/supabase/server', () => ({
    createClient: vi.fn().mockImplementation(() => Promise.resolve(mockSupabase)),
}));

describe('offlineOrderThrottle', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockSupabase.from.mockReturnValue({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            gte: vi.fn().mockReturnThis(),
            neq: vi.fn().mockReturnThis(),
            in: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn(),
        });
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('getOnlineOrderingSettings', () => {
        it('returns default settings when restaurant not found', async () => {
            mockSupabase.from().maybeSingle.mockResolvedValue({ data: null, error: null });

            const settings = await getOnlineOrderingSettings('test-restaurant');

            expect(settings).toEqual({
                enabled: true,
                max_daily_orders: null,
                throttle_minutes: null,
                auto_accept_orders: false,
                estimated_prep_time_minutes: 30,
                free_delivery_threshold: null,
            });
        });

        it('returns default settings on database error', async () => {
            mockSupabase.from().maybeSingle.mockResolvedValue({
                data: null,
                error: new Error('Database error'),
            });

            const settings = await getOnlineOrderingSettings('test-restaurant');

            expect(settings.enabled).toBe(true);
        });

        it('returns settings from restaurant config', async () => {
            mockSupabase.from().maybeSingle.mockResolvedValue({
                data: {
                    settings: {
                        channels: {
                            online_ordering: {
                                enabled: false,
                                max_daily_orders: 100,
                                throttle_minutes: 15,
                                auto_accept_orders: true,
                                estimated_prep_time_minutes: 45,
                                free_delivery_threshold: 500,
                            },
                        },
                    },
                },
                error: null,
            });

            const settings = await getOnlineOrderingSettings('test-restaurant');

            expect(settings.enabled).toBe(false);
            expect(settings.max_daily_orders).toBe(100);
            expect(settings.throttle_minutes).toBe(15);
            expect(settings.auto_accept_orders).toBe(true);
            expect(settings.estimated_prep_time_minutes).toBe(45);
            expect(settings.free_delivery_threshold).toBe(500);
        });

        it('handles partial settings gracefully', async () => {
            mockSupabase.from().maybeSingle.mockResolvedValue({
                data: {
                    settings: {
                        channels: {
                            online_ordering: {
                                enabled: true,
                            },
                        },
                    },
                },
                error: null,
            });

            const settings = await getOnlineOrderingSettings('test-restaurant');

            expect(settings.enabled).toBe(true);
            expect(settings.max_daily_orders).toBeNull();
            expect(settings.throttle_minutes).toBeNull();
        });

        it('handles missing channels config', async () => {
            mockSupabase.from().maybeSingle.mockResolvedValue({
                data: {
                    settings: {},
                },
                error: null,
            });

            const settings = await getOnlineOrderingSettings('test-restaurant');

            expect(settings.enabled).toBe(true);
        });
    });

    describe('checkOrderThrottle', () => {
        it('returns not allowed when online ordering is disabled', async () => {
            mockSupabase.from().maybeSingle.mockResolvedValue({
                data: {
                    settings: {
                        channels: {
                            online_ordering: {
                                enabled: false,
                            },
                        },
                    },
                },
                error: null,
            });

            const result = await checkOrderThrottle('test-restaurant');

            expect(result.allowed).toBe(false);
            expect(result.reason).toBe('Online ordering is currently disabled');
        });

        it('returns allowed when no limits configured', async () => {
            mockSupabase.from().maybeSingle.mockResolvedValue({
                data: {
                    settings: {
                        channels: {
                            online_ordering: {
                                enabled: true,
                                max_daily_orders: null,
                                throttle_minutes: null,
                            },
                        },
                    },
                },
                error: null,
            });

            const result = await checkOrderThrottle('test-restaurant');

            expect(result.allowed).toBe(true);
        });
    });

    describe('getEstimatedWaitTime', () => {
        const mockRestaurantConfig = {
            data: {
                settings: {
                    channels: {
                        online_ordering: {
                            estimated_prep_time_minutes: 30,
                        },
                    },
                },
            },
            error: null,
        };

        it('returns base prep time when no active orders', async () => {
            mockSupabase.from.mockImplementation(table => {
                if (table === 'restaurants') {
                    return {
                        select: vi.fn().mockReturnThis(),
                        eq: vi.fn().mockReturnThis(),
                        maybeSingle: vi.fn().mockResolvedValue(mockRestaurantConfig),
                    };
                }
                return {
                    select: vi.fn().mockReturnThis(),
                    eq: vi.fn().mockReturnThis(),
                    in: vi.fn().mockResolvedValue({ count: 0, error: null }),
                };
            });

            const waitTime = await getEstimatedWaitTime('test-restaurant');

            expect(waitTime).toBeGreaterThanOrEqual(30);
        });

        it('adds time for active orders', async () => {
            mockSupabase.from.mockImplementation(table => {
                if (table === 'restaurants') {
                    return {
                        select: vi.fn().mockReturnThis(),
                        eq: vi.fn().mockReturnThis(),
                        maybeSingle: vi.fn().mockResolvedValue(mockRestaurantConfig),
                    };
                }
                return {
                    select: vi.fn().mockReturnThis(),
                    eq: vi.fn().mockReturnThis(),
                    in: vi.fn().mockResolvedValue({ count: 3, error: null }),
                };
            });

            const waitTime = await getEstimatedWaitTime('test-restaurant');

            // Base 30 + 3 * 5 = 45
            expect(waitTime).toBe(45);
        });

        it('caps additional time at 30 minutes', async () => {
            mockSupabase.from.mockImplementation(table => {
                if (table === 'restaurants') {
                    return {
                        select: vi.fn().mockReturnThis(),
                        eq: vi.fn().mockReturnThis(),
                        maybeSingle: vi.fn().mockResolvedValue(mockRestaurantConfig),
                    };
                }
                return {
                    select: vi.fn().mockReturnThis(),
                    eq: vi.fn().mockReturnThis(),
                    in: vi.fn().mockResolvedValue({ count: 10, error: null }),
                };
            });

            const waitTime = await getEstimatedWaitTime('test-restaurant');

            // Base 30 + min(10 * 5, 30) = 30 + 30 = 60
            expect(waitTime).toBe(60);
        });

        it('returns base time on database error', async () => {
            mockSupabase.from.mockImplementation(table => {
                if (table === 'restaurants') {
                    return {
                        select: vi.fn().mockReturnThis(),
                        eq: vi.fn().mockReturnThis(),
                        maybeSingle: vi.fn().mockResolvedValue(mockRestaurantConfig),
                    };
                }
                return {
                    select: vi.fn().mockReturnThis(),
                    eq: vi.fn().mockReturnThis(),
                    in: vi.fn().mockResolvedValue({ count: 0, error: new Error('DB error') }),
                };
            });

            const waitTime = await getEstimatedWaitTime('test-restaurant');

            expect(waitTime).toBe(30);
        });
    });
});
