/**
 * Schedule Report Modal Component
 * TASK-REPORT-002: Scheduled Reports
 *
 * Modal for creating scheduled reports
 */

'use client';

import { useState } from 'react';

interface ScheduleReportModalProps {
    restaurantId: string;
    onClose: () => void;
    onSuccess: () => void;
}

const REPORT_TYPES = [
    { value: 'sales_summary', label: 'Sales Summary' },
    { value: 'item_performance', label: 'Item Performance' },
    { value: 'labor_analysis', label: 'Labor Analysis' },
    { value: 'payment_reconciliation', label: 'Payment Reconciliation' },
    { value: 'guest_analytics', label: 'Guest Analytics' },
    { value: 'loyalty_summary', label: 'Loyalty Summary' },
    { value: 'delivery_performance', label: 'Delivery Performance' },
] as const;

const FREQUENCIES = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'quarterly', label: 'Quarterly' },
] as const;

const DATE_RANGES = [
    { value: 'previous_day', label: 'Previous Day' },
    { value: 'previous_week', label: 'Previous Week' },
    { value: 'previous_month', label: 'Previous Month' },
    { value: 'week_to_date', label: 'Week to Date' },
    { value: 'month_to_date', label: 'Month to Date' },
] as const;

const DAYS_OF_WEEK = [
    { value: 0, label: 'Sunday' },
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' },
];

export function ScheduleReportModal({
    restaurantId: _restaurantId,
    onClose,
    onSuccess,
}: ScheduleReportModalProps) {
    const [name, setName] = useState('');
    const [reportType, setReportType] = useState<string>('');
    const [frequency, setFrequency] = useState<string>('daily');
    const [runAtTime, setRunAtTime] = useState('06:00');
    const [dayOfWeek, setDayOfWeek] = useState<number>(1);
    const [dayOfMonth, setDayOfMonth] = useState<number>(1);
    const [dateRange, setDateRange] = useState<string>('previous_day');
    const [format, setFormat] = useState<string>('pdf');
    const [recipients, setRecipients] = useState<string>('');
    const [emailSubject, setEmailSubject] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        const recipientEmails = recipients
            .split(/[,\n]/)
            .map(email => email.trim())
            .filter(email => email && email.includes('@'));

        if (!name || !reportType || recipientEmails.length === 0) {
            setError('Please fill in all required fields');
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await fetch('/api/reports/scheduled', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    report_type: reportType,
                    frequency,
                    run_at_time: runAtTime,
                    day_of_week: frequency === 'weekly' ? dayOfWeek : undefined,
                    day_of_month: frequency === 'monthly' ? dayOfMonth : undefined,
                    date_range: dateRange,
                    format,
                    recipient_emails: recipientEmails,
                    email_subject: emailSubject || undefined,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error?.message || 'Failed to create scheduled report');
            }

            onSuccess();
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="mx-4 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white shadow-xl dark:bg-gray-800">
                <div className="p-6">
                    <h2 className="mb-4 text-xl font-semibold">Schedule Report</h2>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="mb-1 block text-sm font-medium">Report Name *</label>
                            <input
                                type="text"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                className="w-full rounded border px-3 py-2 focus:ring-2 focus:ring-blue-500"
                                placeholder="e.g., Daily Sales Report"
                                required
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium">Report Type *</label>
                            <select
                                value={reportType}
                                onChange={e => setReportType(e.target.value)}
                                className="w-full rounded border px-3 py-2 focus:ring-2 focus:ring-blue-500"
                                required
                            >
                                <option value="">Select report type...</option>
                                {REPORT_TYPES.map(type => (
                                    <option key={type.value} value={type.value}>
                                        {type.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="mb-1 block text-sm font-medium">
                                    Frequency *
                                </label>
                                <select
                                    value={frequency}
                                    onChange={e => setFrequency(e.target.value)}
                                    className="w-full rounded border px-3 py-2 focus:ring-2 focus:ring-blue-500"
                                >
                                    {FREQUENCIES.map(freq => (
                                        <option key={freq.value} value={freq.value}>
                                            {freq.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium">Run At *</label>
                                <input
                                    type="time"
                                    value={runAtTime}
                                    onChange={e => setRunAtTime(e.target.value)}
                                    className="w-full rounded border px-3 py-2 focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        {frequency === 'weekly' && (
                            <div>
                                <label className="mb-1 block text-sm font-medium">
                                    Day of Week
                                </label>
                                <select
                                    value={dayOfWeek}
                                    onChange={e => setDayOfWeek(parseInt(e.target.value))}
                                    className="w-full rounded border px-3 py-2 focus:ring-2 focus:ring-blue-500"
                                >
                                    {DAYS_OF_WEEK.map(day => (
                                        <option key={day.value} value={day.value}>
                                            {day.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {frequency === 'monthly' && (
                            <div>
                                <label className="mb-1 block text-sm font-medium">
                                    Day of Month
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max="31"
                                    value={dayOfMonth}
                                    onChange={e => setDayOfMonth(parseInt(e.target.value))}
                                    className="w-full rounded border px-3 py-2 focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="mb-1 block text-sm font-medium">Date Range</label>
                                <select
                                    value={dateRange}
                                    onChange={e => setDateRange(e.target.value)}
                                    className="w-full rounded border px-3 py-2 focus:ring-2 focus:ring-blue-500"
                                >
                                    {DATE_RANGES.map(range => (
                                        <option key={range.value} value={range.value}>
                                            {range.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium">Format</label>
                                <select
                                    value={format}
                                    onChange={e => setFormat(e.target.value)}
                                    className="w-full rounded border px-3 py-2 focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="pdf">PDF</option>
                                    <option value="csv">CSV</option>
                                    <option value="xlsx">Excel</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium">
                                Recipient Emails * (one per line or comma-separated)
                            </label>
                            <textarea
                                value={recipients}
                                onChange={e => setRecipients(e.target.value)}
                                rows={3}
                                className="w-full rounded border px-3 py-2 focus:ring-2 focus:ring-blue-500"
                                placeholder="manager@restaurant.com, owner@restaurant.com"
                                required
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium">
                                Email Subject (optional)
                            </label>
                            <input
                                type="text"
                                value={emailSubject}
                                onChange={e => setEmailSubject(e.target.value)}
                                className="w-full rounded border px-3 py-2 focus:ring-2 focus:ring-blue-500"
                                placeholder="Your Daily Sales Report"
                            />
                        </div>

                        {error && (
                            <div className="rounded bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                                {error}
                            </div>
                        )}

                        <div className="flex gap-3 pt-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 rounded border px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700"
                                disabled={isSubmitting}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="flex-1 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Creating...' : 'Schedule Report'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
