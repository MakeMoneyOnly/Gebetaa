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
    Clock
} from 'lucide-react';
import { useRole } from '@/hooks/useRole';
import { QRCodeSVG } from 'qrcode.react';
import { TableOccupancyGraph } from '@/components/merchant/TableOccupancyGraph';
import { TableGrid, TableGridRow } from '@/components/merchant/TableGrid';
import { TableSessionDrawer } from '@/components/merchant/TableSessionDrawer';
import { OccupancyTimelineBucket, TableOccupancyTimeline } from '@/components/merchant/TableOccupancyTimeline';
import { toast } from 'react-hot-toast';
import { isAbortError } from '@/hooks/useSafeFetch';

// Mock Data (matches dashboard styling/logic)
const mockTables: any[] = [
    { id: 't1', table_number: 'A1', status: 'available', qr_code_url: '', active_order_id: null },
    { id: 't2', table_number: 'A2', status: 'occupied', qr_code_url: '', active_order_id: 'ord-1' },
    { id: 't3', table_number: 'B1', status: 'reserved', qr_code_url: '', active_order_id: null },
    { id: 't4', table_number: 'B2', status: 'bill_requested', qr_code_url: '', active_order_id: 'ord-2' },
    { id: 't5', table_number: 'C1', status: 'available', qr_code_url: '', active_order_id: null },
    { id: 't6', table_number: 'C2', status: 'available', qr_code_url: '', active_order_id: null },
    { id: 't7', table_number: 'D1', status: 'occupied', qr_code_url: '', active_order_id: 'ord-3' },
];

export default function TablesPage() {
    const [tables, setTables] = useState<TableGridRow[]>([]);
    const [selectedTableQR, setSelectedTableQR] = useState<TableGridRow | null>(null);
    const [selectedTableQrUrl, setSelectedTableQrUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
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
    const [batchQrEntries, setBatchQrEntries] = useState<Array<{ id: string; table_number: string; url: string }>>([]);
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
    const [timelineBuckets, setTimelineBuckets] = useState<OccupancyTimelineBucket[]>([]);
    const [isQrLoading, setIsQrLoading] = useState(false);
    
    // Ref for abort controller
    const abortControllerRef = useRef<AbortController | null>(null);
    const isMountedRef = useRef(true);

    const { user } = useRole(null);
    const supabase = createClient();

    // Stats calculations
    const totalTables = tables.length;
    const activeTables = tables.filter(t => t.status !== 'available').length;
    const availableTables = tables.filter(t => t.status === 'available').length;
    const utilizationRate = totalTables > 0 ? Math.round((activeTables / totalTables) * 100) : 0;

    useEffect(() => {
        isMountedRef.current = true;
        
        if (!user) {
            setLoading(false);
            setTables(mockTables as TableGridRow[]);
            setError('Sign in to manage live tables. Showing sample data.');
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
    }, [user, supabase]);

    useEffect(() => {
        const channel = supabase
            .channel('tables-realtime')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'tables' },
                () => {
                    if (user) fetchTables();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [supabase, user]);

    const fetchTables = async (signal?: AbortSignal) => {
        try {
            setLoading(true);
            setError(null);
            const response = await fetch('/api/tables', { method: 'GET', signal });
            const payload = await response.json();
            if (!response.ok) {
                throw new Error(payload?.error ?? 'Failed to load tables.');
            }
            const liveTables = ((payload?.data?.tables ?? []) as Partial<TableGridRow>[]).map((table) => ({
                id: table.id ?? '',
                table_number: table.table_number ?? 'N/A',
                status: (table.status as TableGridRow['status']) ?? 'available',
                qr_code_url: table.qr_code_url ?? null,
                active_order_id: table.active_order_id ?? null,
            }));
            if (isMountedRef.current) {
                setTables(liveTables);
            }
        } catch (error) {
            // Silently ignore abort errors
            if (isAbortError(error)) {
                return;
            }
            console.error('Error fetching tables:', error);
            setError(error instanceof Error ? error.message : 'Failed to fetch tables.');
            if (!tables.length && isMountedRef.current) {
                setTables(mockTables as TableGridRow[]);
            }
        } finally {
            if (isMountedRef.current) {
                setLoading(false);
            }
        }
    };

    const fetchOccupancyTimeline = async (signal?: AbortSignal) => {
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
            }
        } catch (error) {
            // Silently ignore abort errors
            if (isAbortError(error)) {
                return;
            }
            console.error(error);
            if (isMountedRef.current) {
                setTimelineBuckets([]);
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
            setTables((prev) => prev.filter((table) => table.id !== tableToDelete.id));
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
            const response = await fetch(`/api/tables/${table.id}/qr/regenerate`, { method: 'POST' });
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
                tables.map(async (table) => {
                    const response = await fetch(`/api/tables/${table.id}/qr/regenerate`, { method: 'POST' });
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

            setBatchQrEntries(results.filter((entry) => Boolean(entry.url)));
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
        <div className="space-y-8 pb-20 min-h-screen">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-4xl font-bold text-black mb-2 tracking-tight">Tables & QR</h1>
                    <p className="text-gray-500 font-medium">Manage tables and generate QR codes.</p>
                    {error && <p className="text-xs mt-2 text-amber-700 font-semibold">{error}</p>}
                    {isQrLoading && <p className="text-xs mt-2 text-gray-500 font-semibold">Generating signed QR...</p>}
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => {
                            void handleOpenBatchQrModal();
                        }}
                        disabled={isBatchQrLoading || tables.length === 0}
                        className="h-12 px-5 bg-white text-black border border-gray-200 rounded-xl flex items-center gap-2 hover:bg-gray-50 transition-colors font-bold text-sm disabled:opacity-50"
                    >
                        <Download className="h-4 w-4" />
                        {isBatchQrLoading ? 'Generating...' : 'Batch QR'}
                    </button>
                    <button
                        onClick={() => {
                            resetForm();
                            setIsCreateModalOpen(true);
                        }}
                        className="h-12 px-5 bg-black text-white rounded-xl flex items-center gap-2 hover:bg-gray-800 transition-colors shadow-lg shadow-black/10 font-bold text-sm"
                    >
                        <Plus className="h-4 w-4" />
                        Add Table
                    </button>
                </div>
            </div>

            {/* Stats Row - Inspired by Dashboard Asymmetric Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
                {/* Total Tables Card */}
                <div className="bg-white p-5 rounded-[2rem] flex flex-col justify-between h-[180px] relative overflow-hidden shadow-sm hover:shadow-md transition-all group">
                    <div className="flex justify-between items-start mb-2">
                        <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center text-gray-900 shadow-sm">
                            <LayoutGrid className="h-4 w-4" />
                        </div>
                        <div className="flex flex-col items-end gap-1">
                            <span className="bg-gray-100 text-gray-600 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">
                                Capacity
                            </span>
                            <h3 className="text-4xl font-bold text-gray-900 tracking-tight mt-[20px]">{totalTables}</h3>
                        </div>
                    </div>

                    <div className="absolute bottom-5 left-5 right-5">
                        <div className="mb-3">
                            <h3 className="text-gray-900 font-bold text-lg leading-none mb-1">Total Tables</h3>
                            <p className="text-gray-400 text-xs font-medium">Restaurant Capacity</p>
                        </div>

                        <div className="flex justify-between text-[10px] font-medium text-gray-400 mb-2">
                            <span>Used: {activeTables}</span>
                            <span>Total: {totalTables}</span>
                        </div>
                        <div className="flex justify-between items-center gap-1">
                            {Array.from({ length: 20 }).map((_, i) => {
                                const activeCount = Math.round((totalTables / 30) * 20) || 10; // Mock calculation
                                const isActive = i < activeCount;
                                const opacity = isActive ? 0.3 + (0.7 * (i / activeCount)) : 1;
                                return (
                                    <div
                                        key={i}
                                        style={{ opacity: isActive ? opacity : 1 }}
                                        className={`h-[15px] w-[15px] rounded-full ${isActive ? 'bg-gray-800' : 'bg-gray-100'}`}
                                    />
                                )
                            })}
                        </div>
                    </div>
                </div>

                {/* Occupied/Active Card */}
                <div className="bg-white p-5 rounded-[2rem] flex flex-col justify-between h-[180px] relative overflow-hidden shadow-sm hover:shadow-md transition-all group">
                    <div className="flex justify-between items-start mb-2">
                        <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center text-orange-600 shadow-sm">
                            <UserX className="h-4 w-4" />
                        </div>
                        <div className="flex flex-col items-end gap-1">
                            <span className="bg-orange-50 text-orange-600 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">
                                {utilizationRate}% Full
                            </span>
                            <h3 className="text-4xl font-bold text-gray-900 tracking-tight mt-[20px]">{activeTables}</h3>
                        </div>
                    </div>

                    <div className="absolute bottom-5 left-5 right-5">
                        <div className="mb-3">
                            <h3 className="text-gray-900 font-bold text-lg leading-none mb-1">Occupied</h3>
                            <p className="text-gray-400 text-xs font-medium">Currently Seated</p>
                        </div>

                        <div className="flex justify-between text-[10px] font-medium text-gray-400 mb-2">
                            <span>Current: {activeTables}</span>
                            <span>Goal: {totalTables}</span>
                        </div>
                        <div className="flex justify-between items-center gap-1">
                            {Array.from({ length: 20 }).map((_, i) => {
                                const activeCount = Math.round((activeTables / totalTables) * 20) || 0;
                                const isActive = i < activeCount;
                                const opacity = isActive ? 0.3 + (0.7 * (i / activeCount)) : 1;
                                return (
                                    <div
                                        key={i}
                                        style={{ opacity: isActive ? opacity : 1 }}
                                        className={`h-[15px] w-[15px] rounded-full ${isActive ? 'bg-orange-500' : 'bg-gray-100'}`}
                                    />
                                )
                            })}
                        </div>
                    </div>
                </div>

                {/* Reserved - New Card */}
                <div className="bg-white p-5 rounded-[2rem] flex flex-col justify-between h-[180px] relative overflow-hidden shadow-sm hover:shadow-md transition-all group">
                    <div className="flex justify-between items-start mb-2">
                        <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center text-blue-600 shadow-sm">
                            <Clock className="h-4 w-4" />
                        </div>
                        <div className="flex flex-col items-end gap-1">
                            <span className="bg-blue-50 text-blue-600 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">
                                Upcoming
                            </span>
                            <h3 className="text-4xl font-bold text-gray-900 tracking-tight mt-[20px]">2</h3>
                        </div>
                    </div>

                    <div className="absolute bottom-5 left-5 right-5">
                        <div className="mb-3">
                            <h3 className="text-gray-900 font-bold text-lg leading-none mb-1">Reserved</h3>
                            <p className="text-gray-400 text-xs font-medium">Coming Soon</p>
                        </div>

                        <div className="flex justify-between text-[10px] font-medium text-gray-400 mb-2">
                            <span>Reserved: 2</span>
                            <span>Total: {totalTables}</span>
                        </div>
                        <div className="flex justify-between items-center gap-1">
                            {Array.from({ length: 20 }).map((_, i) => {
                                const activeCount = 4; // Mock
                                const isActive = i < activeCount;
                                const opacity = isActive ? 0.3 + (0.7 * (i / activeCount)) : 1;
                                return (
                                    <div
                                        key={i}
                                        style={{ opacity: isActive ? opacity : 1 }}
                                        className={`h-[15px] w-[15px] rounded-full ${isActive ? 'bg-blue-500' : 'bg-gray-100'}`}
                                    />
                                )
                            })}
                        </div>
                    </div>
                </div>

                {/* Available Card */}
                <div className="bg-white p-5 rounded-[2rem] flex flex-col justify-between h-[180px] relative overflow-hidden shadow-sm hover:shadow-md transition-all group">
                    <div className="flex justify-between items-start mb-2">
                        <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center text-green-600 shadow-sm">
                            <CheckCircle className="h-4 w-4" />
                        </div>
                        <div className="flex flex-col items-end gap-1">
                            <span className="bg-green-50 text-green-600 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">
                                Ready
                            </span>
                            <h3 className="text-4xl font-bold text-gray-900 tracking-tight mt-[20px]">{availableTables}</h3>
                        </div>
                    </div>

                    <div className="absolute bottom-5 left-5 right-5">
                        <div className="mb-3">
                            <h3 className="text-gray-900 font-bold text-lg leading-none mb-1">Available</h3>
                            <p className="text-gray-400 text-xs font-medium">Ready for Guests</p>
                        </div>

                        <div className="flex justify-between text-[10px] font-medium text-gray-400 mb-2">
                            <span>Free: {availableTables}</span>
                            <span>Total: {totalTables}</span>
                        </div>
                        <div className="flex justify-between items-center gap-1">
                            {Array.from({ length: 20 }).map((_, i) => {
                                const activeCount = Math.round((availableTables / totalTables) * 20) || 0;
                                const isActive = i < activeCount;
                                const opacity = isActive ? 0.3 + (0.7 * (i / activeCount)) : 1;
                                return (
                                    <div
                                        key={i}
                                        style={{ opacity: isActive ? opacity : 1 }}
                                        className={`h-[15px] w-[15px] rounded-full ${isActive ? 'bg-green-500' : 'bg-gray-100'}`}
                                    />
                                )
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Tables Grid */}
            <h2 className="text-xl font-bold text-black mt-8 mb-4">All Tables</h2>
            <TableGrid
                tables={tables}
                isLoading={loading}
                onAddTable={() => {
                    resetForm();
                    setIsCreateModalOpen(true);
                }}
                onEditTable={openEditTableModal}
                onDeleteTable={(table) => setTableToDelete(table)}
                onShowQR={(table) => {
                    void handleOpenQrModal(table);
                }}
                onRefreshTable={(table) => {
                    void handleOpenSessionDrawer(table);
                }}
            />

            {/* Table Occupancy Heatmap */}
            <TableOccupancyGraph tables={tables} />
            <TableOccupancyTimeline buckets={timelineBuckets} />

            {/* QR Code Modal */}
            {
                selectedTableQR && selectedTableQrUrl && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-6 animate-in fade-in duration-300">
                        <div className="bg-white w-full max-w-sm rounded-[3rem] p-8 relative shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col items-center">
                            <button
                                className="absolute right-6 top-6 h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-black hover:text-white transition-all"
                                onClick={() => {
                                    setSelectedTableQR(null);
                                    setSelectedTableQrUrl(null);
                                }}
                            >
                                <X className="h-5 w-5" />
                            </button>

                            <div className="h-16 w-16 rounded-2xl bg-black flex items-center justify-center text-white mb-6 shadow-xl shadow-black/20 mt-4">
                                <Scan className="h-8 w-8" />
                            </div>

                            <h3 className="text-3xl font-bold text-gray-900 tracking-tight mb-2">Table {selectedTableQR.table_number}</h3>
                            <p className="text-gray-500 font-medium text-center mb-8 px-4">
                                Scan this code to view the menu and place orders directly from this table.
                            </p>

                            <div className="p-8 bg-white rounded-[2.5rem] shadow-lg border border-gray-100 mx-auto w-fit mb-8 relative overflow-hidden group">
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
                                className="w-full h-14 bg-black text-white rounded-2xl font-bold text-base hover:bg-gray-800 transition-all shadow-xl shadow-black/20 flex items-center justify-center gap-3 hover:scale-[1.02]"
                                onClick={() => {
                                    const svg = document.getElementById("qr-code-svg");
                                    if (svg) {
                                        const svgData = new XMLSerializer().serializeToString(svg);
                                        const canvas = document.createElement("canvas");
                                        const ctx = canvas.getContext("2d");
                                        const img = new Image();
                                        img.onload = () => {
                                            canvas.width = img.width;
                                            canvas.height = img.height;
                                            ctx?.drawImage(img, 0, 0);
                                            const pngFile = canvas.toDataURL("image/png");
                                            const downloadLink = document.createElement("a");
                                            downloadLink.download = `Table-${selectedTableQR.table_number}-QR.png`;
                                            downloadLink.href = pngFile;
                                            downloadLink.click();
                                        };
                                        img.src = "data:image/svg+xml;base64," + btoa(svgData);
                                    }
                                }}
                            >
                                <Download className="h-5 w-5" />
                                Download QR Code
                            </button>
                        </div>
                    </div>
                )
            }

            {isBatchQrModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="w-full max-w-4xl rounded-3xl bg-white p-6 shadow-xl">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">Batch QR Export</h3>
                                <p className="text-sm text-gray-500">{batchQrEntries.length} table QR codes ready.</p>
                            </div>
                            <button
                                className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-black hover:text-white transition-all"
                                onClick={() => setIsBatchQrModalOpen(false)}
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div id="batch-qr-print-sheet" className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-4 max-h-[60vh] overflow-y-auto">
                            {batchQrEntries.map((entry) => (
                                <div key={entry.id} className="rounded-2xl border border-gray-200 p-4 text-center">
                                    <p className="text-xs font-bold text-gray-500 mb-2">Table {entry.table_number}</p>
                                    <QRCodeSVG id={`batch-qr-${entry.id}`} value={entry.url} size={120} level="H" includeMargin />
                                </div>
                            ))}
                        </div>

                        <div className="mt-6 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={handleBatchQrPrint}
                                className="h-10 px-4 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 inline-flex items-center gap-2"
                            >
                                <Printer className="h-4 w-4" />
                                Print Sheet
                            </button>
                            <button
                                type="button"
                                onClick={handleBatchQrDownload}
                                className="h-10 px-4 rounded-xl bg-black text-sm font-semibold text-white hover:bg-gray-800 inline-flex items-center gap-2"
                            >
                                <Download className="h-4 w-4" />
                                Download All PNG
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
                        <h3 className="text-xl font-bold text-gray-900">Create table</h3>
                        <p className="mt-1 text-sm text-gray-500">Add a new table to your floor plan.</p>
                        <form onSubmit={handleCreateTable} className="mt-5 space-y-3">
                            <input
                                value={tableNumberInput}
                                onChange={(e) => setTableNumberInput(e.target.value)}
                                placeholder="Table number (e.g. A1)"
                                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400"
                            />
                            <input
                                type="number"
                                min={1}
                                max={50}
                                value={capacityInput}
                                onChange={(e) => setCapacityInput(e.target.value)}
                                placeholder="Capacity"
                                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400"
                            />
                            <input
                                value={zoneInput}
                                onChange={(e) => setZoneInput(e.target.value)}
                                placeholder="Zone (optional)"
                                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400"
                            />
                            {formError && <p className="text-xs text-red-600">{formError}</p>}
                            <div className="flex justify-end gap-2 pt-2">
                                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="h-10 px-4 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                                    Cancel
                                </button>
                                <button type="submit" disabled={isSubmitting} className="h-10 px-4 rounded-xl bg-black text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50">
                                    {isSubmitting ? 'Creating...' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isEditModalOpen && tableToEdit && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
                        <h3 className="text-xl font-bold text-gray-900">Edit table</h3>
                        <p className="mt-1 text-sm text-gray-500">Update table details and status.</p>
                        <form onSubmit={handleEditTable} className="mt-5 space-y-3">
                            <input
                                value={tableNumberInput}
                                onChange={(e) => setTableNumberInput(e.target.value)}
                                placeholder="Table number"
                                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400"
                            />
                            <input
                                type="number"
                                min={1}
                                max={50}
                                value={capacityInput}
                                onChange={(e) => setCapacityInput(e.target.value)}
                                placeholder="Capacity"
                                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400"
                            />
                            <input
                                value={zoneInput}
                                onChange={(e) => setZoneInput(e.target.value)}
                                placeholder="Zone (optional)"
                                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400"
                            />
                            <select
                                value={statusInput}
                                onChange={(e) => setStatusInput(e.target.value as TableGridRow['status'])}
                                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400"
                            >
                                <option value="available">Available</option>
                                <option value="occupied">Occupied</option>
                                <option value="reserved">Reserved</option>
                                <option value="bill_requested">Bill requested</option>
                            </select>
                            <div className="rounded-xl border border-gray-200 p-3 space-y-2">
                                <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Table Session Actions</p>
                                <div className="grid grid-cols-2 gap-2">
                                    <input
                                        type="number"
                                        min={1}
                                        max={50}
                                        value={guestCountInput}
                                        onChange={(e) => setGuestCountInput(e.target.value)}
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
                                        onChange={(e) => setTransferTargetTableId(e.target.value)}
                                        className="h-9 rounded-lg border border-gray-200 px-2 text-xs outline-none focus:border-gray-400"
                                    >
                                        <option value="">Transfer to table...</option>
                                        {tables
                                            .filter((table) => table.id !== tableToEdit.id)
                                            .map((table) => (
                                                <option key={table.id} value={table.id}>
                                                    {table.table_number}
                                                </option>
                                            ))}
                                    </select>
                                    <button
                                        type="button"
                                        onClick={handleTransferTableSession}
                                        disabled={isSessionActionLoading}
                                        className="h-9 px-3 rounded-lg bg-black text-xs font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
                                    >
                                        Transfer
                                    </button>
                                </div>
                            </div>
                            {formError && <p className="text-xs text-red-600">{formError}</p>}
                            <div className="flex justify-end gap-2 pt-2">
                                <button type="button" onClick={() => setIsEditModalOpen(false)} className="h-10 px-4 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                                    Cancel
                                </button>
                                <button type="submit" disabled={isSubmitting} className="h-10 px-4 rounded-xl bg-black text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50">
                                    {isSubmitting ? 'Saving...' : 'Save'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {tableToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
                        <h3 className="text-xl font-bold text-gray-900">Delete table</h3>
                        <p className="mt-2 text-sm text-gray-600">
                            Delete table <span className="font-semibold text-gray-900">{tableToDelete.table_number}</span>?
                        </p>
                        <p className="mt-1 text-sm text-red-600">This action cannot be undone.</p>
                        <div className="mt-6 flex justify-end gap-2">
                            <button type="button" onClick={() => setTableToDelete(null)} className="h-10 px-4 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                                Cancel
                            </button>
                            <button type="button" onClick={handleDeleteTable} disabled={isDeleting} className="h-10 px-4 rounded-xl bg-red-600 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50">
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
        </div >
    );
}
