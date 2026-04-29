import { describe, expect, it, vi } from 'vitest';
import {
    calculateLaborMetricsFromTimeEntries,
    getHourlyRateConfig,
    getStaffHourlyRate,
    DEFAULT_ROLE_HOURLY_RATES,
    getLaborCostPercentage,
} from '../laborReportsService';

describe('laborReportsService', () => {
    describe('calculateLaborMetricsFromTimeEntries', () => {
        it('uses real time entries, rates, and tips for payroll-facing labor KPIs', () => {
            const metrics = calculateLaborMetricsFromTimeEntries({
                salesTotal: 2000,
                timeEntries: [
                    {
                        staff_id: 'staff-1',
                        clock_in_at: '2026-04-28T08:00:00.000Z',
                        clock_out_at: '2026-04-28T16:00:00.000Z',
                    },
                    {
                        staff_id: 'staff-2',
                        clock_in_at: '2026-04-28T10:00:00.000Z',
                        clock_out_at: '2026-04-28T14:00:00.000Z',
                    },
                ],
                staffRoles: {
                    'staff-1': 'manager',
                    'staff-2': 'waiter',
                },
                hourlyRateConfig: {
                    defaultRate: 50,
                    roleRates: {
                        manager: 80,
                        waiter: 40,
                    },
                },
                tipAllocations: [
                    {
                        total_tips_distributed: 300,
                    },
                ],
            });

            expect(metrics.totalHours).toBe(12);
            expect(metrics.laborCost).toBe(800);
            expect(metrics.laborCostPercent).toBe(40);
            expect(metrics.tipsDistributed).toBe(300);
        });
    });

    describe('getHourlyRateConfig', () => {
        it('returns default config on error', async () => {
            const mockSupabase = {
                from: vi.fn().mockReturnValue({
                    select: vi.fn().mockReturnValue({
                        eq: vi.fn().mockReturnValue({
                            single: vi.fn().mockResolvedValue({ error: new Error('DB Error') }),
                        }),
                    }),
                }),
            } as any;

            const config = await getHourlyRateConfig(mockSupabase, 'resto-1');
            expect(config.defaultRate).toBe(DEFAULT_ROLE_HOURLY_RATES.default);
        });

        it('returns parsed config when settings exist', async () => {
            const mockSupabase = {
                from: vi.fn().mockReturnValue({
                    select: vi.fn().mockReturnValue({
                        eq: vi.fn().mockReturnValue({
                            single: vi.fn().mockResolvedValue({
                                data: {
                                    settings: {
                                        labor: {
                                            defaultHourlyRate: 100,
                                            roleHourlyRates: { manager: 150 },
                                            staffHourlyRates: { 'staff-1': 200 },
                                        },
                                    },
                                },
                            }),
                        }),
                    }),
                }),
            } as any;

            const config = await getHourlyRateConfig(mockSupabase, 'resto-1');
            expect(config.defaultRate).toBe(100);
            expect(config.roleRates?.manager).toBe(150);
            expect(config.staffRates?.['staff-1']).toBe(200);
        });
    });

    describe('getStaffHourlyRate', () => {
        const config = {
            defaultRate: 50,
            roleRates: { manager: 80 },
            staffRates: { 'staff-1': 100 },
        };

        it('uses staff rate if available', () => {
            expect(getStaffHourlyRate('staff-1', 'manager', config)).toBe(100);
        });

        it('uses role rate if available and no staff rate', () => {
            expect(getStaffHourlyRate('staff-2', 'manager', config)).toBe(80);
        });

        it('uses default rate if neither available', () => {
            expect(getStaffHourlyRate('staff-2', 'cook', config)).toBe(50);
        });
    });

    describe('getLaborCostPercentage', () => {
        it('returns error on database failure', async () => {
            const mockSupabase = {
                from: vi.fn().mockReturnValue({
                    select: vi.fn().mockReturnValue({
                        eq: vi.fn().mockReturnValue({
                            error: new Error('DB Error'),
                        }),
                    }),
                }),
            } as any;

            const result = await getLaborCostPercentage(
                mockSupabase,
                'resto-1',
                '2026-04-28',
                '2026-04-29'
            );
            expect(result.error).toBeTruthy();
        });
    });
});
