'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Clock3, Plus } from 'lucide-react';
import { toast } from 'react-hot-toast';

type StaffMember = {
    id: string;
    user_id: string;
    role: string;
    is_active: boolean | null;
};

type ShiftRecord = {
    id: string;
    staff_id: string;
    role: string;
    shift_date: string;
    start_time: string;
    end_time: string;
    station: string | null;
    status: string;
    notes: string | null;
};

type ScheduleResponse = {
    window: { start_date: string; end_date: string };
    shifts: ShiftRecord[];
    staff: Array<{ id: string; user_id: string; role: string; is_active: boolean | null }>;
};

function toDateInput(date: Date) {
    return date.toISOString().slice(0, 10);
}

function plusDays(date: Date, days: number) {
    return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

function timeLabel(raw: string) {
    return raw.slice(0, 5);
}

function shiftStatusClass(status: string) {
    switch (status) {
        case 'in_progress':
            return 'bg-blue-100 text-blue-700';
        case 'completed':
            return 'bg-emerald-100 text-emerald-700';
        case 'cancelled':
            return 'bg-gray-100 text-gray-600';
        case 'missed':
            return 'bg-rose-100 text-rose-700';
        default:
            return 'bg-amber-100 text-amber-700';
    }
}

export function ScheduleCalendar({ staff }: { staff: StaffMember[] }) {
    const [windowStart, setWindowStart] = useState(() => new Date());
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [schedule, setSchedule] = useState<ScheduleResponse | null>(null);

    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        staff_id: '',
        role: 'waiter',
        shift_date: toDateInput(new Date()),
        start_time: '09:00',
        end_time: '17:00',
        station: '',
        notes: '',
    });

    useEffect(() => {
        if (!form.staff_id && staff.length > 0) {
            setForm(prev => ({ ...prev, staff_id: staff[0].id, role: staff[0].role ?? 'waiter' }));
        }
    }, [form.staff_id, staff]);

    const loadSchedule = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const start = toDateInput(windowStart);
            const end = toDateInput(plusDays(windowStart, 6));
            const response = await fetch(
                `/api/staff/schedule?start_date=${start}&end_date=${end}`,
                { cache: 'no-store' }
            );

            if (!response.ok) {
                let errorMessage = 'Failed to load schedule.';
                try {
                    const payload = await response.json();
                    errorMessage = payload?.error ?? errorMessage;
                } catch {
                    // non-json error (e.g. 500 html page)
                    errorMessage = `Error ${response.status}: ${response.statusText}`;
                }
                throw new Error(errorMessage);
            }

            const payload = await response.json();
            setSchedule(payload.data as ScheduleResponse);
        } catch (fetchError) {
            setError(fetchError instanceof Error ? fetchError.message : 'Failed to load schedule.');
        } finally {
            setLoading(false);
        }
    }, [windowStart]);

    useEffect(() => {
        void loadSchedule();
    }, [loadSchedule]);

    const groupedByDate = useMemo(() => {
        const map = new Map<string, ShiftRecord[]>();
        for (const shift of schedule?.shifts ?? []) {
            const list = map.get(shift.shift_date) ?? [];
            list.push(shift);
            map.set(shift.shift_date, list);
        }
        return map;
    }, [schedule?.shifts]);

    const days = useMemo(() => {
        return Array.from({ length: 7 }).map((_, index) => {
            const date = plusDays(windowStart, index);
            return {
                key: toDateInput(date),
                label: date.toLocaleDateString([], {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                }),
            };
        });
    }, [windowStart]);

    const createShift = async () => {
        setSaving(true);
        try {
            const selectedStaff = staff.find(member => member.id === form.staff_id);
            const response = await fetch('/api/staff/schedule', {
                method: 'POST',
                headers: {
                    'content-type': 'application/json',
                    'x-idempotency-key': crypto.randomUUID(),
                },
                body: JSON.stringify({
                    ...form,
                    role: form.role || selectedStaff?.role || 'waiter',
                    station: form.station || null,
                    notes: form.notes || null,
                }),
            });

            const payload = await response.json();
            if (!response.ok) {
                throw new Error(payload?.error ?? 'Failed to create shift.');
            }

            toast.success('Shift scheduled.');
            await loadSchedule();
        } catch (saveError) {
            toast.error(saveError instanceof Error ? saveError.message : 'Failed to create shift.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <section className="rounded-[2.5rem] border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">Schedule Calendar</h2>
                    <p className="text-sm text-gray-500">
                        Plan staff coverage by shift and station.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setWindowStart(prev => plusDays(prev, -7))}
                        className="h-9 w-9 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
                    >
                        <ChevronLeft className="mx-auto h-4 w-4" />
                    </button>
                    <button
                        onClick={() => setWindowStart(prev => plusDays(prev, 7))}
                        className="h-9 w-9 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
                    >
                        <ChevronRight className="mx-auto h-4 w-4" />
                    </button>
                </div>
            </div>

            <div className="mb-6 grid grid-cols-1 gap-2 md:grid-cols-7">
                {days.map(day => (
                    <div
                        key={day.key}
                        className="rounded-2xl border border-gray-100 bg-gray-50 p-3"
                    >
                        <p className="text-xs font-bold tracking-wide text-gray-500 uppercase">
                            {day.label}
                        </p>
                        <div className="mt-3 space-y-2">
                            {(groupedByDate.get(day.key) ?? []).length === 0 ? (
                                <p className="text-xs text-gray-400">No shifts</p>
                            ) : (
                                (groupedByDate.get(day.key) ?? []).map(shift => (
                                    <div
                                        key={shift.id}
                                        className="rounded-xl border border-gray-100 bg-white p-2"
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="text-xs font-semibold text-gray-800">
                                                {timeLabel(shift.start_time)} -{' '}
                                                {timeLabel(shift.end_time)}
                                            </span>
                                            <span
                                                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${shiftStatusClass(shift.status)}`}
                                            >
                                                {shift.status}
                                            </span>
                                        </div>
                                        <p className="mt-1 text-[11px] text-gray-500">
                                            Staff: {shift.staff_id.slice(0, 8)}
                                        </p>
                                        {shift.station ? (
                                            <p className="text-[11px] text-gray-500">
                                                Station: {shift.station}
                                            </p>
                                        ) : null}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-4">
                <div className="mb-3 flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-gray-500" />
                    <h3 className="text-sm font-bold text-gray-800">Add Shift</h3>
                </div>
                <div className="grid grid-cols-1 gap-2 md:grid-cols-6">
                    <select
                        value={form.staff_id}
                        onChange={event =>
                            setForm(prev => ({ ...prev, staff_id: event.target.value }))
                        }
                        className="h-10 rounded-lg border border-gray-200 bg-white px-2 text-sm"
                    >
                        {staff.map(member => (
                            <option key={member.id} value={member.id}>
                                {member.user_id.slice(0, 8)} ({member.role})
                            </option>
                        ))}
                    </select>
                    <input
                        type="date"
                        value={form.shift_date}
                        onChange={event =>
                            setForm(prev => ({ ...prev, shift_date: event.target.value }))
                        }
                        className="h-10 rounded-lg border border-gray-200 bg-white px-2 text-sm"
                    />
                    <input
                        type="time"
                        value={form.start_time}
                        onChange={event =>
                            setForm(prev => ({ ...prev, start_time: event.target.value }))
                        }
                        className="h-10 rounded-lg border border-gray-200 bg-white px-2 text-sm"
                    />
                    <input
                        type="time"
                        value={form.end_time}
                        onChange={event =>
                            setForm(prev => ({ ...prev, end_time: event.target.value }))
                        }
                        className="h-10 rounded-lg border border-gray-200 bg-white px-2 text-sm"
                    />
                    <input
                        value={form.station}
                        onChange={event =>
                            setForm(prev => ({ ...prev, station: event.target.value }))
                        }
                        placeholder="Station"
                        className="h-10 rounded-lg border border-gray-200 bg-white px-2 text-sm"
                    />
                    <button
                        type="button"
                        disabled={saving || !form.staff_id}
                        onClick={() => {
                            void createShift();
                        }}
                        className="h-10 rounded-lg bg-black px-3 text-sm font-bold text-white hover:bg-gray-800 disabled:opacity-50"
                    >
                        <span className="inline-flex items-center gap-1">
                            <Plus className="h-4 w-4" />
                            {saving ? 'Saving...' : 'Add Shift'}
                        </span>
                    </button>
                </div>
                {error ? <p className="mt-2 text-xs font-semibold text-rose-700">{error}</p> : null}
                {!loading ? null : (
                    <div className="mt-2 inline-flex items-center gap-2 text-xs text-gray-500">
                        <Clock3 className="h-3.5 w-3.5" />
                        Refreshing schedule...
                    </div>
                )}
            </div>
        </section>
    );
}
