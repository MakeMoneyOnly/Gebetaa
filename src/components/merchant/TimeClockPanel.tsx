'use client';

import { useEffect, useMemo, useState } from 'react';
import { Clock3 } from 'lucide-react';
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
    shift_date: string;
    start_time: string;
    end_time: string;
    status: string;
};

function todayIso() {
    return new Date().toISOString().slice(0, 10);
}

export function TimeClockPanel({ staff }: { staff: StaffMember[] }) {
    const [staffId, setStaffId] = useState('');
    const [shifts, setShifts] = useState<ShiftRecord[]>([]);
    const [shiftId, setShiftId] = useState('');
    const [note, setNote] = useState('');
    const [working, setWorking] = useState(false);
    const [lastResult, setLastResult] = useState<string | null>(null);

    useEffect(() => {
        if (!staffId && staff.length > 0) {
            setStaffId(staff[0].id);
        }
    }, [staffId, staff]);

    useEffect(() => {
        const loadTodayShifts = async () => {
            if (!staffId) return;
            try {
                const date = todayIso();
                const response = await fetch(`/api/staff/schedule?start_date=${date}&end_date=${date}`, { cache: 'no-store' });
                const payload = await response.json();
                if (!response.ok) return;

                const rows = ((payload?.data?.shifts ?? []) as ShiftRecord[]).filter((item) => item.staff_id === staffId);
                setShifts(rows);
                if (rows.length > 0 && !shiftId) {
                    setShiftId(rows[0].id);
                }
            } catch {
                // Keep panel functional even when schedule fetch fails.
            }
        };

        void loadTodayShifts();
    }, [staffId, shiftId]);

    const activeStaffLabel = useMemo(() => {
        const row = staff.find((member) => member.id === staffId);
        if (!row) return 'Select staff';
        return `${row.user_id.slice(0, 8)} (${row.role})`;
    }, [staff, staffId]);

    const runClock = async (action: 'in' | 'out') => {
        if (!staffId) {
            toast.error('Select a staff member first.');
            return;
        }

        setWorking(true);
        try {
            const response = await fetch('/api/staff/time-entries/clock', {
                method: 'POST',
                headers: {
                    'content-type': 'application/json',
                    'x-idempotency-key': crypto.randomUUID(),
                },
                body: JSON.stringify({
                    staff_id: staffId,
                    action,
                    shift_id: shiftId || undefined,
                    source: 'dashboard',
                    note: note || undefined,
                }),
            });
            const payload = await response.json();
            if (!response.ok) {
                throw new Error(payload?.error ?? `Failed to clock ${action}.`);
            }

            setLastResult(
                action === 'in'
                    ? `Clocked in at ${new Date(payload?.data?.entry?.clock_in_at ?? Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                    : `Clocked out at ${new Date(payload?.data?.entry?.clock_out_at ?? Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
            );
            toast.success(action === 'in' ? 'Clocked in.' : 'Clocked out.');
        } catch (clockError) {
            toast.error(clockError instanceof Error ? clockError.message : `Failed to clock ${action}.`);
        } finally {
            setWorking(false);
        }
    };

    return (
        <section className="rounded-[2.5rem] border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-start justify-between">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">Time Clock Panel</h2>
                    <p className="text-sm text-gray-500">Clock team members in and out in real time.</p>
                </div>
                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-700">{activeStaffLabel}</span>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                <select
                    value={staffId}
                    onChange={(event) => setStaffId(event.target.value)}
                    className="h-10 rounded-lg border border-gray-200 px-2 text-sm"
                >
                    {staff.map((member) => (
                        <option key={member.id} value={member.id}>
                            {member.user_id.slice(0, 8)} ({member.role})
                        </option>
                    ))}
                </select>

                <select
                    value={shiftId}
                    onChange={(event) => setShiftId(event.target.value)}
                    className="h-10 rounded-lg border border-gray-200 px-2 text-sm"
                >
                    <option value="">No linked shift</option>
                    {shifts.map((shift) => (
                        <option key={shift.id} value={shift.id}>
                            {shift.start_time.slice(0, 5)} - {shift.end_time.slice(0, 5)} ({shift.status})
                        </option>
                    ))}
                </select>

                <input
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    placeholder="Note (optional)"
                    className="h-10 rounded-lg border border-gray-200 px-2 text-sm"
                />

                <div className="grid grid-cols-2 gap-2">
                    <button
                        type="button"
                        disabled={working}
                        onClick={() => {
                            void runClock('in');
                        }}
                        className="h-10 rounded-lg bg-emerald-600 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                    >
                        Clock In
                    </button>
                    <button
                        type="button"
                        disabled={working}
                        onClick={() => {
                            void runClock('out');
                        }}
                        className="h-10 rounded-lg bg-gray-900 text-sm font-bold text-white hover:bg-black disabled:opacity-50"
                    >
                        Clock Out
                    </button>
                </div>
            </div>

            <div className="mt-3 inline-flex items-center gap-2 text-xs font-medium text-gray-500">
                <Clock3 className="h-3.5 w-3.5" />
                {lastResult ?? 'No clock action recorded in this session.'}
            </div>
        </section>
    );
}
