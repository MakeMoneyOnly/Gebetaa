import { describe, expect, it } from 'vitest';
import { calculateLaborMetricsFromTimeEntries } from '../laborReportsService';

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
