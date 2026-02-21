'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase';
import {
    Plus,
    X,
    Download,
    Printer,
    Scan,
    LayoutGrid,
    CheckCircle,
    UserX,
    Clock,
} from 'lucide-react';
import { useRole } from '@/hooks/useRole';
import { QRCodeSVG } from 'qrcode.react';
import { TableOccupancyGraph } from '@/components/merchant/TableOccupancyGraph';
import { TableGrid, TableGridRow } from '@/components/merchant/TableGrid';
import { TableSessionDrawer } from '@/components/merchant/TableSessionDrawer';
import {
    OccupancyTimelineBucket,
    TableOccupancyTimeline,
} from '@/components/merchant/TableOccupancyTimeline';
import { toast } from 'react-hot-toast';
import { isAbortError } from '@/hooks/useSafeFetch';
import { usePageLoadGuard } from '@/hooks/usePageLoadGuard';

export default function TablesPage() {
    const [tables, setTables] = useState<TableGridRow[]>(() => {
        if (typeof window === 'undefined') return [];
        try {
            const cached = sessionStorage.getItem('tables.cache');
            return cached ? JSON.parse(cached) : [];
        } catch {
            return [];
        }
    });
    const [selectedTableQR, setSelectedTableQR] = useState<TableGridRow | null>(null);
    const [selectedTableQrUrl, setSelectedTableQrUrl] = useState<string | null>(null);
    // If we have cached tables, we can consider the page loaded enough to show content
    // while we fetch updates in background.
    const { loading: guardLoading, markLoaded } = usePageLoadGuard('tables');
    const loading = guardLoading && tables.length === 0;
    const [error, setError] = useState<string | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [tableToDelete, setTableToDelete] = useState<TableGridRow | null>(null);
    const [tableToEdit, setTableToEdit] = useState<TableGridRow | null>(null);
    const [tableNumberInput, setTableNumberInput] = useState('');
    const [capacityInput, setCapacityInput] = useState('4');
    const [zoneInput, setZoneInput] = useState('');
    const [statusInput, setStatusInput] = useState<TableGridRow['status']>('available');
    const [formError, setFormError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [guestCountInput, setGuestCountInput] = useState('1');
    const [transferTargetTableId, setTransferTargetTableId] = useState('');
    const [isSessionActionLoading, setIsSessionActionLoading] = useState(false);
    const [isBatchQrModalOpen, setIsBatchQrModalOpen] = useState(false);
    const [isBatchQrLoading, setIsBatchQrLoading] = useState(false);
    const [batchQrEntries, setBatchQrEntries] = useState<
        Array<{ id: string; table_number: string; url: string }>
    >([]);
    const [isSessionDrawerOpen, setIsSessionDrawerOpen] = useState(false);
    const [sessionDrawerTableNumber, setSessionDrawerTableNumber] = useState<string | null>(null);
    const [sessionDrawerLoading, setSessionDrawerLoading] = useState(false);
    const [sessionDrawerData, setSessionDrawerData] = useState<{
        id: string;
        status: string;
        guest_count: number | null;
        opened_at: string | null;
        closed_at: string | null;
        assigned_staff_id: string | null;
        notes: string | null;
    } | null>(null);
    const [timelineBuckets, setTimelineBuckets] = useState<OccupancyTimelineBucket[]>(() => {
        if (typeof window === 'undefined') return [];
        try {
            const cached = sessionStorage.getItem('tables.timeline.cache');
            return cached ? JSON.parse(cached) : [];
        } catch {
            return [];
        }
    });
    const [isQrLoading, setIsQrLoading] = useState(false);

    // Ref for abort controller
    const abortControllerRef = useRef<AbortController | null>(null);
    const isMountedRef = useRef(true);

    const { user, loading: roleLoading } = useRole(null);
    const supabase = createClient();

    // Stats calculations
    const totalTables = tables.length;
    const activeTables = tables.filter(t => t.status !== 'available').length;
    const availableTables = tables.filter(t => t.status === 'available').length;
    const reservedTables = tables.filter(t => t.status === 'reserved').length;
    const utilizationRate = totalTables > 0 ? Math.round((activeTables / totalTables) * 100) : 0;

    useEffect(() => {
        isMountedRef.current = true;

        if (roleLoading) return;

        if (!user) {
            markLoaded();
            setTables([]);
            return;
        }

        // Create abort controller for this effect
        abortControllerRef.current = new AbortController();
        const signal = abortControllerRef.current.signal;

        fetchTables(signal);
        void fetchOccupancyTimeline(signal);

        return () => {
            isMountedRef.current = false;
            abortControllerRef.current?.abort();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, roleLoading, supabase]);

    useEffect(() => {
        const channel = supabase
            .channel('tables-realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'tables' }, () => {
                if (user) void fetchTables();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [supabase, user]);

    const fetchTables = async (signal?: AbortSignal) => {
        try {
            setError(null);
            const response = await fetch('/api/tables', { method: 'GET', signal });
            const payload = await response.json();
            if (!response.ok) {
                throw new Error(payload?.error ?? 'Failed to load tables.');
            }
            const liveTables = ((payload?.data?.tables ?? []) as Partial<TableGridRow>[]).map(
                table => ({
                    id: table.id ?? '',
                    table_number: table.table_number ?? 'N/A',
                    status: (table.status as TableGridRow['status']) ?? 'available',
                    qr_code_url: table.qr_code_url ?? null,
                    active_order_id: table.active_order_id ?? null,
                })
            );
            if (isMountedRef.current) {
                setTables(liveTables);
                try {
                    sessionStorage.setItem('tables.cache', JSON.stringify(liveTables));
                } catch {}
            }
        } catch (error) {
            // Silently ignore abort errors
            if (isAbortError(error)) {
                return;
            }
            console.error('Error fetching tables:', error);
            setError(error instanceof Error ? error.message : 'Failed to fetch tables.');
            if (!tables.length && isMountedRef.current) {
                setTables([]);
            }
        } finally {
            if (isMountedRef.current) {
                markLoaded();
            }
        }
    };

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const fetchOccupancyTimeline = async (_signal?: AbortSignal) => {
        try {
            const since = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();
            const { data, error } = await supabase
                .from('table_sessions')
                .select('opened_at, closed_at')
                .gte('opened_at', since)
                .order('opened_at', { ascending: true })
                .limit(300);

            if (error) {
                throw new Error(error.message || 'Failed to load occupancy timeline.');
            }

            const bucketsMap = new Map<string, { opens: number; closes: number }>();
            for (let i = 5; i >= 0; i -= 1) {
                const date = new Date(Date.now() - i * 2 * 60 * 60 * 1000);
                const label = `${date.getHours().toString().padStart(2, '0')}:00`;
                bucketsMap.set(label, { opens: 0, closes: 0 });
            }

            for (const row of data ?? []) {
                const openedAt = row.opened_at ? new Date(row.opened_at) : null;
                const closedAt = row.closed_at ? new Date(row.closed_at) : null;
                if (openedAt) {
                    const label = `${openedAt.getHours().toString().padStart(2, '0')}:00`;
                    if (bucketsMap.has(label)) {
                        const bucket = bucketsMap.get(label)!;
                        bucket.opens += 1;
                    }
                }
                if (closedAt) {
                    const label = `${closedAt.getHours().toString().padStart(2, '0')}:00`;
                    if (bucketsMap.has(label)) {
                        const bucket = bucketsMap.get(label)!;
                        bucket.closes += 1;
                    }
                }
            }

            if (isMountedRef.current) {
                setTimelineBuckets(
                    Array.from(bucketsMap.entries()).map(([label, value]) => ({
                        label,
                        opens: value.opens,
                        closes: value.closes,
                    }))
                );
                try {
                    const buckets = Array.from(bucketsMap.entries()).map(([label, value]) => ({
                        label,
                        opens: value.opens,
                        closes: value.closes,
                    }));
                    sessionStorage.setItem('tables.timeline.cache', JSON.stringify(buckets));
                } catch {}
            }
        } catch (error) {
            // Silently ignore abort errors
            if (isAbortError(error)) {
                return;
            }
            console.error(error);
            if (isMountedRef.current) {
                setTimelineBuckets([]);
                try {
                    sessionStorage.removeItem('tables.timeline.cache');
                } catch {}
            }
        }
    };

    const resetForm = () => {
        setTableNumberInput('');
        setCapacityInput('4');
        setZoneInput('');
        setStatusInput('available');
        setGuestCountInput('1');
        setTransferTargetTableId('');
        setFormError(null);
    };

    const validateTableForm = () => {
        const trimmedNumber = tableNumberInput.trim();
        if (!trimmedNumber) {
            return { ok: false as const, error: 'Table number is required.' };
        }
        const parsedCapacity = Number.parseInt(capacityInput, 10);
        if (!Number.isFinite(parsedCapacity) || parsedCapacity <= 0 || parsedCapacity > 50) {
            return { ok: false as const, error: 'Capacity must be between 1 and 50.' };
        }
        return {
            ok: true as const,
            data: {
                table_number: trimmedNumber,
                capacity: parsedCapacity,
                zone: zoneInput.trim() ? zoneInput.trim() : null,
                status: statusInput,
            },
        };
    };

    const handleCreateTable = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const parsed = validateTableForm();
        if (!parsed.ok) {
            setFormError(parsed.error);
            return;
        }
        try {
            setIsSubmitting(true);
            setFormError(null);
            const response = await fetch('/api/tables', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(parsed.data),
            });
            const payload = await response.json();
            if (!response.ok) {
                throw new Error(payload?.error ?? 'Failed to create table.');
            }
            setIsCreateModalOpen(false);
            resetForm();
            toast.success('Table created.');
            void fetchTables();
            void fetchOccupancyTimeline();
        } catch (err: any) {
            toast.error('Error adding table: ' + (err.message || 'Unknown error'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const openEditTableModal = (table: TableGridRow) => {
        setTableToEdit(table);
        setTableNumberInput(table.table_number);
        setCapacityInput('4');
        setZoneInput('');
        setStatusInput(table.status);
        setGuestCountInput('1');
        setTransferTargetTableId('');
        setFormError(null);
        setIsEditModalOpen(true);
    };

    const handleEditTable = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!tableToEdit) return;
        const parsed = validateTableForm();
        if (!parsed.ok) {
            setFormError(parsed.error);
            return;
        }
        try {
            setIsSubmitting(true);
            setFormError(null);
            const response = await fetch(`/api/tables/${tableToEdit.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(parsed.data),
            });
            const payload = await response.json();
            if (!response.ok) {
                throw new Error(payload?.error ?? 'Failed to update table.');
            }
            setIsEditModalOpen(false);
            setTableToEdit(null);
            resetForm();
            toast.success('Table updated.');
            void fetchTables();
            void fetchOccupancyTimeline();
        } catch (error: any) {
            toast.error(error?.message ?? 'Error updating table.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteTable = async () => {
        if (!tableToDelete) return;
        try {
            setIsDeleting(true);
            const response = await fetch(`/api/tables/${tableToDelete.id}`, { method: 'DELETE' });
            const payload = await response.json();
            if (!response.ok) {
                throw new Error(payload?.error ?? 'Failed to delete table.');
            }
            setTables(prev => prev.filter(table => table.id !== tableToDelete.id));
            setTableToDelete(null);
            toast.success('Table deleted.');
            void fetchOccupancyTimeline();
        } catch (error: any) {
            toast.error(error?.message ?? 'Error deleting table.');
        } finally {
            setIsDeleting(false);
        }
    };

    const getOpenSessionIdForTable = async (tableId: string) => {
        const { data, error } = await supabase
            .from('table_sessions')
            .select('id')
            .eq('table_id', tableId)
            .eq('status', 'open')
            .maybeSingle();

        if (error) {
            throw new Error(error.message || 'Failed to locate open table session.');
        }
        if (!data?.id) {
            throw new Error('No open table session found for this table.');
        }
        return data.id;
    };

    const handleOpenTableSession = async () => {
        if (!tableToEdit) return;
        const guestCount = Number.parseInt(guestCountInput, 10);
        if (!Number.isFinite(guestCount) || guestCount <= 0 || guestCount > 50) {
            toast.error('Guest count must be between 1 and 50.');
            return;
        }
        try {
            setIsSessionActionLoading(true);
            const response = await fetch('/api/table-sessions/open', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    table_id: tableToEdit.id,
                    guest_count: guestCount,
                }),
            });
            const payload = await response.json();
            if (!response.ok) {
                throw new Error(payload?.error ?? 'Failed to open table session.');
            }
            toast.success('Table seated successfully.');
            void fetchTables();
            void fetchOccupancyTimeline();
        } catch (error: any) {
            toast.error(error?.message ?? 'Failed to seat table.');
        } finally {
            setIsSessionActionLoading(false);
        }
    };

    const handleCloseTableSession = async () => {
        if (!tableToEdit) return;
        try {
            setIsSessionActionLoading(true);
            const sessionId = await getOpenSessionIdForTable(tableToEdit.id);
            const response = await fetch(`/api/table-sessions/${sessionId}/close`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}),
            });
            const payload = await response.json();
            if (!response.ok) {
                throw new Error(payload?.error ?? 'Failed to close table session.');
            }
            toast.success('Table session closed.');
            void fetchTables();
            void fetchOccupancyTimeline();
        } catch (error: any) {
            toast.error(error?.message ?? 'Failed to close session.');
        } finally {
            setIsSessionActionLoading(false);
        }
    };

    const handleTransferTableSession = async () => {
        if (!tableToEdit) return;
        if (!transferTargetTableId) {
            toast.error('Select destination table.');
            return;
        }
        if (transferTargetTableId === tableToEdit.id) {
            toast.error('Choose a different destination table.');
            return;
        }
        try {
            setIsSessionActionLoading(true);
            const sessionId = await getOpenSessionIdForTable(tableToEdit.id);
            const response = await fetch(`/api/table-sessions/${sessionId}/transfer`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ to_table_id: transferTargetTableId }),
            });
            const payload = await response.json();
            if (!response.ok) {
                throw new Error(payload?.error ?? 'Failed to transfer table session.');
            }
            toast.success('Session transferred.');
            setTransferTargetTableId('');
            void fetchTables();
            void fetchOccupancyTimeline();
        } catch (error: any) {
            toast.error(error?.message ?? 'Failed to transfer session.');
        } finally {
            setIsSessionActionLoading(false);
        }
    };

    const handleOpenQrModal = async (table: TableGridRow) => {
        try {
            setIsQrLoading(true);
            const response = await fetch(`/api/tables/${table.id}/qr/regenerate`, {
                method: 'POST',
            });
            const payload = await response.json();
            if (!response.ok) {
                throw new Error(payload?.error ?? 'Failed to generate signed QR.');
            }
            const qrUrl = payload?.data?.qr?.url as string | undefined;
            setSelectedTableQR(table);
            if (!qrUrl) {
                throw new Error('Signed QR URL missing from response.');
            }
            setSelectedTableQrUrl(qrUrl);
        } catch (error: any) {
            toast.error(error?.message ?? 'Failed to generate QR.');
        } finally {
            setIsQrLoading(false);
        }
    };

    const handleOpenBatchQrModal = async () => {
        try {
            setIsBatchQrLoading(true);
            const results = await Promise.all(
                tables.map(async table => {
                    const response = await fetch(`/api/tables/${table.id}/qr/regenerate`, {
                        method: 'POST',
                    });
                    const payload = await response.json();
                    if (!response.ok) {
                        throw new Error(payload?.error ?? `Failed for table ${table.table_number}`);
                    }
                    return {
                        id: table.id,
                        table_number: table.table_number,
                        url: (payload?.data?.qr?.url as string) ?? table.qr_code_url ?? '',
                    };
                })
            );

            setBatchQrEntries(results.filter(entry => Boolean(entry.url)));
            setIsBatchQrModalOpen(true);
        } catch (error: any) {
            toast.error(error?.message ?? 'Failed to generate batch QR sheet.');
        } finally {
            setIsBatchQrLoading(false);
        }
    };

    const handleBatchQrPrint = () => {
        const container = document.getElementById('batch-qr-print-sheet');
        if (!container) return;
        const printWindow = window.open('', '_blank', 'width=900,height=700');
        if (!printWindow) return;
        printWindow.document.write(`
            <html>
              <head><title>Table QR Codes</title></head>
              <body style="font-family: Arial, sans-serif; padding: 24px;">
                <h2>Table QR Codes</h2>
                ${container.innerHTML}
              </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
    };

    const handleBatchQrDownload = () => {
        for (const entry of batchQrEntries) {
            const svg = document.getElementById(`batch-qr-${entry.id}`);
            if (!svg) continue;
            const svgData = new XMLSerializer().serializeToString(svg);
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            img.onload = () => {
                canvas.width = img.width;
                canvas.height = img.height;
                ctx?.drawImage(img, 0, 0);
                const pngFile = canvas.toDataURL('image/png');
                const downloadLink = document.createElement('a');
                downloadLink.download = `Table-${entry.table_number}-QR.png`;
                downloadLink.href = pngFile;
                downloadLink.click();
            };
            img.src = `data:image/svg+xml;base64,${btoa(svgData)}`;
        }
    };

    const handleOpenSessionDrawer = async (table: TableGridRow) => {
        setIsSessionDrawerOpen(true);
        setSessionDrawerTableNumber(table.table_number);
        setSessionDrawerLoading(true);
        setSessionDrawerData(null);

        try {
            const { data, error } = await supabase
                .from('table_sessions')
                .select('id, status, guest_count, opened_at, closed_at, assigned_staff_id, notes')
                .eq('table_id', table.id)
                .order('opened_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (error) {
                throw new Error(error.message || 'Failed to fetch session state.');
            }
            setSessionDrawerData(data ?? null);
        } catch (error: any) {
            toast.error(error?.message ?? 'Could not load session state.');
        } finally {
            setSessionDrawerLoading(false);
        }
    };

    return (
        <div className="min-h-screen space-y-8 pb-20">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="mb-2 text-4xl font-bold tracking-tight text-black">
                        Tables & QR
                    </h1>
                    <p className="font-medium text-gray-500">
                        Manage tables and generate QR codes.
                    </p>
                    {error && <p className="mt-2 text-xs font-semibold text-amber-700">{error}</p>}
                    {isQrLoading && (
                        <p className="mt-2 text-xs font-semibold text-gray-500">
                            Generating signed QR...
                        </p>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => {
                            void handleOpenBatchQrModal();
                        }}
                        disabled={isBatchQrLoading || tables.length === 0}
                        className="flex h-12 items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 text-sm font-bold text-black transition-colors hover:bg-gray-50 disabled:opacity-50"
                    >
                        <Download className="h-4 w-4" />
                        {isBatchQrLoading ? 'Generating...' : 'Batch QR'}
                    </button>
                    <button
                        onClick={() => {
                            resetForm();
                            setIsCreateModalOpen(true);
                        }}
                        className="flex h-12 items-center gap-2 rounded-xl bg-black px-5 text-sm font-bold text-white shadow-lg shadow-black/10 transition-colors hover:bg-gray-800"
                    >
                        <Plus className="h-4 w-4" />
                        Add Table
                    </button>
                </div>
            </div>

            {/* Stats Row - Inspired by Dashboard Asymmetric Grid */}
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
                {/* Total Tables Card */}
                <div className="group relative flex h-[180px] flex-col justify-between overflow-hidden rounded-[2rem] bg-white p-5 shadow-sm transition-all hover:shadow-md">
                    <div className="mb-2 flex items-start justify-between">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-gray-900 shadow-sm">
                            <LayoutGrid className="h-4 w-4" />
                        </div>
                        <div className="flex flex-col items-end gap-1">
                            <span className="rounded-full bg-gray-100 px-2 py-1 text-[10px] font-bold tracking-wider text-gray-600 uppercase">
                                Capacity
                            </span>
                            <h3 className="mt-[20px] text-4xl font-bold tracking-tight text-gray-900">
                                {totalTables}
                            </h3>
                        </div>
                    </div>

                    <div className="absolute right-5 bottom-5 left-5">
                        <div className="mb-3">
                            <h3 className="mb-1 text-lg leading-none font-bold text-gray-900">
                                Total Tables
                            </h3>
                            <p className="text-xs font-medium text-gray-400">Restaurant Capacity</p>
                        </div>

                        <div className="mb-2 flex justify-between text-[10px] font-medium text-gray-400">
                            <span>Used: {activeTables}</span>
                            <span>Total: {totalTables}</span>
                        </div>
                        <div className="flex items-center justify-between gap-1">
                            {Array.from({ length: 20 }).map((_, i) => {
                                const activeCount = Math.round(
                                    (totalTables / (totalTables || 1)) * 20
                                );
                                const isActive = i < activeCount;
                                const opacity = isActive ? 0.3 + 0.7 * (i / activeCount) : 1;
                                return (
                                    <div
                                        key={i}
                                        style={{ opacity: isActive ? opacity : 1 }}
                                        className={`h-[15px] w-[15px] rounded-full ${isActive ? 'bg-gray-800' : 'bg-gray-100'}`}
                                    />
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Occupied/Active Card */}
                <div className="group relative flex h-[180px] flex-col justify-between overflow-hidden rounded-[2rem] bg-white p-5 shadow-sm transition-all hover:shadow-md">
                    <div className="mb-2 flex items-start justify-between">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-orange-600 shadow-sm">
                            <UserX className="h-4 w-4" />
                        </div>
                        <div className="flex flex-col items-end gap-1">
                            <span className="rounded-full bg-orange-50 px-2 py-1 text-[10px] font-bold tracking-wider text-orange-600 uppercase">
                                {utilizationRate}% Full
                            </span>
                            <h3 className="mt-[20px] text-4xl font-bold tracking-tight text-gray-900">
                                {activeTables}
                            </h3>
                        </div>
                    </div>

                    <div className="absolute right-5 bottom-5 left-5">
                        <div className="mb-3">
                            <h3 className="mb-1 text-lg leading-none font-bold text-gray-900">
                                Occupied
                            </h3>
                            <p className="text-xs font-medium text-gray-400">Currently Seated</p>
                        </div>

                        <div className="mb-2 flex justify-between text-[10px] font-medium text-gray-400">
                            <span>Current: {activeTables}</span>
                            <span>Goal: {totalTables}</span>
                        </div>
                        <div className="flex items-center justify-between gap-1">
                            {Array.from({ length: 20 }).map((_, i) => {
                                const activeCount =
                                    Math.round((activeTables / totalTables) * 20) || 0;
                                const isActive = i < activeCount;
                                const opacity = isActive ? 0.3 + 0.7 * (i / activeCount) : 1;
                                return (
                                    <div
                                        key={i}
                                        style={{ opacity: isActive ? opacity : 1 }}
                                        className={`h-[15px] w-[15px] rounded-full ${isActive ? 'bg-orange-500' : 'bg-gray-100'}`}
                                    />
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Reserved - New Card */}
                <div className="group relative flex h-[180px] flex-col justify-between overflow-hidden rounded-[2rem] bg-white p-5 shadow-sm transition-all hover:shadow-md">
                    <div className="mb-2 flex items-start justify-between">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-blue-600 shadow-sm">
                            <Clock className="h-4 w-4" />
                        </div>
                        <div className="flex flex-col items-end gap-1">
                            <span className="rounded-full bg-blue-50 px-2 py-1 text-[10px] font-bold tracking-wider text-blue-600 uppercase">
                                Upcoming
                            </span>
                            <h3 className="mt-[20px] text-4xl font-bold tracking-tight text-gray-900">
                                {reservedTables}
                            </h3>
                        </div>
                    </div>

                    <div className="absolute right-5 bottom-5 left-5">
                        <div className="mb-3">
                            <h3 className="mb-1 text-lg leading-none font-bold text-gray-900">
                                Reserved
                            </h3>
                            <p className="text-xs font-medium text-gray-400">Coming Soon</p>
                        </div>

                        <div className="mb-2 flex justify-between text-[10px] font-medium text-gray-400">
                            <span>Reserved: {reservedTables}</span>
                            <span>Total: {totalTables}</span>
                        </div>
                        <div className="flex items-center justify-between gap-1">
                            {Array.from({ length: 20 }).map((_, i) => {
                                const activeCount = Math.round(
                                    (reservedTables / (totalTables || 1)) * 20
                                );
                                const isActive = i < activeCount;
                                const opacity = isActive ? 0.3 + 0.7 * (i / activeCount) : 1;
                                return (
                                    <div
                                        key={i}
                                        style={{ opacity: isActive ? opacity : 1 }}
                                        className={`h-[15px] w-[15px] rounded-full ${isActive ? 'bg-blue-500' : 'bg-gray-100'}`}
                                    />
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Available Card */}
                <div className="group relative flex h-[180px] flex-col justify-between overflow-hidden rounded-[2rem] bg-white p-5 shadow-sm transition-all hover:shadow-md">
                    <div className="mb-2 flex items-start justify-between">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-green-600 shadow-sm">
                            <CheckCircle className="h-4 w-4" />
                        </div>
                        <div className="flex flex-col items-end gap-1">
                            <span className="rounded-full bg-green-50 px-2 py-1 text-[10px] font-bold tracking-wider text-green-600 uppercase">
                                Ready
                            </span>
                            <h3 className="mt-[20px] text-4xl font-bold tracking-tight text-gray-900">
                                {availableTables}
                            </h3>
                        </div>
                    </div>

                    <div className="absolute right-5 bottom-5 left-5">
                        <div className="mb-3">
                            <h3 className="mb-1 text-lg leading-none font-bold text-gray-900">
                                Available
                            </h3>
                            <p className="text-xs font-medium text-gray-400">Ready for Guests</p>
                        </div>

                        <div className="mb-2 flex justify-between text-[10px] font-medium text-gray-400">
                            <span>Free: {availableTables}</span>
                            <span>Total: {totalTables}</span>
                        </div>
                        <div className="flex items-center justify-between gap-1">
                            {Array.from({ length: 20 }).map((_, i) => {
                                const activeCount =
                                    Math.round((availableTables / totalTables) * 20) || 0;
                                const isActive = i < activeCount;
                                const opacity = isActive ? 0.3 + 0.7 * (i / activeCount) : 1;
                                return (
                                    <div
                                        key={i}
                                        style={{ opacity: isActive ? opacity : 1 }}
                                        className={`h-[15px] w-[15px] rounded-full ${isActive ? 'bg-green-500' : 'bg-gray-100'}`}
                                    />
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Tables Grid */}
            <h2 className="mt-8 mb-4 text-xl font-bold text-black">All Tables</h2>
            <TableGrid
                tables={tables}
                isLoading={loading}
                onAddTable={() => {
                    resetForm();
                    setIsCreateModalOpen(true);
                }}
                onEditTable={openEditTableModal}
                onDeleteTable={table => setTableToDelete(table)}
                onShowQR={table => {
                    void handleOpenQrModal(table);
                }}
                onRefreshTable={table => {
                    void handleOpenSessionDrawer(table);
                }}
            />

            {/* Table Occupancy Heatmap */}
            <TableOccupancyGraph tables={tables} />
            <TableOccupancyTimeline buckets={timelineBuckets} />

            {/* QR Code Modal */}
            {selectedTableQR && selectedTableQrUrl && (
                <div className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6 backdrop-blur-md duration-300">
                    <div className="animate-in zoom-in-95 relative flex w-full max-w-sm flex-col items-center rounded-[3rem] bg-white p-8 shadow-2xl duration-300">
                        <button
                            className="absolute top-6 right-6 flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition-all hover:bg-black hover:text-white"
                            onClick={() => {
                                setSelectedTableQR(null);
                                setSelectedTableQrUrl(null);
                            }}
                        >
                            <X className="h-5 w-5" />
                        </button>

                        <div className="mt-4 mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-black text-white shadow-xl shadow-black/20">
                            <Scan className="h-8 w-8" />
                        </div>

                        <h3 className="mb-2 text-3xl font-bold tracking-tight text-gray-900">
                            Table {selectedTableQR.table_number}
                        </h3>
                        <p className="mb-8 px-4 text-center font-medium text-gray-500">
                            Scan this code to view the menu and place orders directly from this
                            table.
                        </p>

                        <div className="group relative mx-auto mb-8 w-fit overflow-hidden rounded-[2.5rem] border border-gray-100 bg-white p-8 shadow-lg">
                            <div className="absolute inset-0 bg-gradient-to-br from-transparent to-gray-50 opacity-50" />
                            <div className="relative z-10">
                                <QRCodeSVG
                                    id="qr-code-svg"
                                    value={selectedTableQrUrl}
                                    size={180}
                                    level="H"
                                    includeMargin={true}
                                />
                            </div>
                        </div>

                        <button
                            className="flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-black text-base font-bold text-white shadow-xl shadow-black/20 transition-all hover:scale-[1.02] hover:bg-gray-800"
                            onClick={() => {
                                const svg = document.getElementById('qr-code-svg');
                                if (svg) {
                                    const svgData = new XMLSerializer().serializeToString(svg);
                                    const canvas = document.createElement('canvas');
                                    const ctx = canvas.getContext('2d');
                                    const img = new Image();
                                    img.onload = () => {
                                        canvas.width = img.width;
                                        canvas.height = img.height;
                                        ctx?.drawImage(img, 0, 0);
                                        const pngFile = canvas.toDataURL('image/png');
                                        const downloadLink = document.createElement('a');
                                        downloadLink.download = `Table-${selectedTableQR.table_number}-QR.png`;
                                        downloadLink.href = pngFile;
                                        downloadLink.click();
                                    };
                                    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
                                }
                            }}
                        >
                            <Download className="h-5 w-5" />
                            Download QR Code
                        </button>
                    </div>
                </div>
            )}

            {isBatchQrModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-4xl rounded-3xl bg-white p-6 shadow-xl">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">Batch QR Export</h3>
                                <p className="text-sm text-gray-500">
                                    {batchQrEntries.length} table QR codes ready.
                                </p>
                            </div>
                            <button
                                className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition-all hover:bg-black hover:text-white"
                                onClick={() => setIsBatchQrModalOpen(false)}
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div
                            id="batch-qr-print-sheet"
                            className="mt-5 grid max-h-[60vh] grid-cols-2 gap-4 overflow-y-auto md:grid-cols-4"
                        >
                            {batchQrEntries.map(entry => (
                                <div
                                    key={entry.id}
                                    className="rounded-2xl border border-gray-200 p-4 text-center"
                                >
                                    <p className="mb-2 text-xs font-bold text-gray-500">
                                        Table {entry.table_number}
                                    </p>
                                    <QRCodeSVG
                                        id={`batch-qr-${entry.id}`}
                                        value={entry.url}
                                        size={120}
                                        level="H"
                                        includeMargin
                                    />
                                </div>
                            ))}
                        </div>

                        <div className="mt-6 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={handleBatchQrPrint}
                                className="inline-flex h-10 items-center gap-2 rounded-xl border border-gray-200 px-4 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                            >
                                <Printer className="h-4 w-4" />
                                Print Sheet
                            </button>
                            <button
                                type="button"
                                onClick={handleBatchQrDownload}
                                className="inline-flex h-10 items-center gap-2 rounded-xl bg-black px-4 text-sm font-semibold text-white hover:bg-gray-800"
                            >
                                <Download className="h-4 w-4" />
                                Download All PNG
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
                        <h3 className="text-xl font-bold text-gray-900">Create table</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            Add a new table to your floor plan.
                        </p>
                        <form onSubmit={handleCreateTable} className="mt-5 space-y-3">
                            <input
                                value={tableNumberInput}
                                onChange={e => setTableNumberInput(e.target.value)}
                                placeholder="Table number (e.g. A1)"
                                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400"
                            />
                            <input
                                type="number"
                                min={1}
                                max={50}
                                value={capacityInput}
                                onChange={e => setCapacityInput(e.target.value)}
                                placeholder="Capacity"
                                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400"
                            />
                            <input
                                value={zoneInput}
                                onChange={e => setZoneInput(e.target.value)}
                                placeholder="Zone (optional)"
                                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400"
                            />
                            {formError && <p className="text-xs text-red-600">{formError}</p>}
                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="h-10 rounded-xl border border-gray-200 px-4 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="h-10 rounded-xl bg-black px-4 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
                                >
                                    {isSubmitting ? 'Creating...' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isEditModalOpen && tableToEdit && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
                        <h3 className="text-xl font-bold text-gray-900">Edit table</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            Update table details and status.
                        </p>
                        <form onSubmit={handleEditTable} className="mt-5 space-y-3">
                            <input
                                value={tableNumberInput}
                                onChange={e => setTableNumberInput(e.target.value)}
                                placeholder="Table number"
                                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400"
                            />
                            <input
                                type="number"
                                min={1}
                                max={50}
                                value={capacityInput}
                                onChange={e => setCapacityInput(e.target.value)}
                                placeholder="Capacity"
                                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400"
                            />
                            <input
                                value={zoneInput}
                                onChange={e => setZoneInput(e.target.value)}
                                placeholder="Zone (optional)"
                                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400"
                            />
                            <select
                                value={statusInput}
                                onChange={e =>
                                    setStatusInput(e.target.value as TableGridRow['status'])
                                }
                                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400"
                            >
                                <option value="available">Available</option>
                                <option value="occupied">Occupied</option>
                                <option value="reserved">Reserved</option>
                                <option value="bill_requested">Bill requested</option>
                            </select>
                            <div className="space-y-2 rounded-xl border border-gray-200 p-3">
                                <p className="text-xs font-bold tracking-wide text-gray-500 uppercase">
                                    Table Session Actions
                                </p>
                                <div className="grid grid-cols-2 gap-2">
                                    <input
                                        type="number"
                                        min={1}
                                        max={50}
                                        value={guestCountInput}
                                        onChange={e => setGuestCountInput(e.target.value)}
                                        placeholder="Guests"
                                        className="w-full rounded-lg border border-gray-200 px-2.5 py-2 text-xs outline-none focus:border-gray-400"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleOpenTableSession}
                                        disabled={isSessionActionLoading}
                                        className="h-9 rounded-lg bg-emerald-600 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                                    >
                                        {isSessionActionLoading ? 'Working...' : 'Seat Table'}
                                    </button>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleCloseTableSession}
                                    disabled={isSessionActionLoading}
                                    className="h-9 w-full rounded-lg bg-gray-100 text-xs font-semibold text-gray-700 hover:bg-gray-200 disabled:opacity-50"
                                >
                                    Close Session
                                </button>
                                <div className="grid grid-cols-[1fr_auto] gap-2">
                                    <select
                                        value={transferTargetTableId}
                                        onChange={e => setTransferTargetTableId(e.target.value)}
                                        className="h-9 rounded-lg border border-gray-200 px-2 text-xs outline-none focus:border-gray-400"
                                    >
                                        <option value="">Transfer to table...</option>
                                        {tables
                                            .filter(table => table.id !== tableToEdit.id)
                                            .map(table => (
                                                <option key={table.id} value={table.id}>
                                                    {table.table_number}
                                                </option>
                                            ))}
                                    </select>
                                    <button
                                        type="button"
                                        onClick={handleTransferTableSession}
                                        disabled={isSessionActionLoading}
                                        className="h-9 rounded-lg bg-black px-3 text-xs font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
                                    >
                                        Transfer
                                    </button>
                                </div>
                            </div>
                            {formError && <p className="text-xs text-red-600">{formError}</p>}
                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="h-10 rounded-xl border border-gray-200 px-4 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="h-10 rounded-xl bg-black px-4 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
                                >
                                    {isSubmitting ? 'Saving...' : 'Save'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {tableToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
                        <h3 className="text-xl font-bold text-gray-900">Delete table</h3>
                        <p className="mt-2 text-sm text-gray-600">
                            Delete table{' '}
                            <span className="font-semibold text-gray-900">
                                {tableToDelete.table_number}
                            </span>
                            ?
                        </p>
                        <p className="mt-1 text-sm text-red-600">This action cannot be undone.</p>
                        <div className="mt-6 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setTableToDelete(null)}
                                className="h-10 rounded-xl border border-gray-200 px-4 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleDeleteTable}
                                disabled={isDeleting}
                                className="h-10 rounded-xl bg-red-600 px-4 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                            >
                                {isDeleting ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <TableSessionDrawer
                open={isSessionDrawerOpen}
                tableNumber={sessionDrawerTableNumber}
                loading={sessionDrawerLoading}
                session={sessionDrawerData}
                onClose={() => setIsSessionDrawerOpen(false)}
            />
        </div>
    );
}
