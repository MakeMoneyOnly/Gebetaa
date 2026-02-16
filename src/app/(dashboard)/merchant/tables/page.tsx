'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import {
    Plus,
    Trash2,
    QrCode,
    RefreshCcw,
    X,
    Download,
    Scan,
    LayoutGrid,
    CheckCircle,
    UserX,
    TrendingUp,
    MoreHorizontal,
    Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRole } from '@/hooks/useRole';
import { QRCodeSVG } from 'qrcode.react';
import { TableOccupancyGraph } from '@/components/merchant/TableOccupancyGraph';

interface Table {
    id: string;
    table_number: string;
    status: 'available' | 'occupied' | 'reserved' | 'bill_requested';
    qr_code_url: string;
    active_order_id: string | null;
}

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
    const [tables, setTables] = useState<Table[]>(mockTables);
    const [selectedTableQR, setSelectedTableQR] = useState<Table | null>(null);
    const [restaurantSlug, setRestaurantSlug] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const { user } = useRole(null);
    const supabase = createClient();

    // Stats calculations
    const totalTables = tables.length;
    const activeTables = tables.filter(t => t.status !== 'available').length;
    const availableTables = tables.filter(t => t.status === 'available').length;
    const utilizationRate = totalTables > 0 ? Math.round((activeTables / totalTables) * 100) : 0;

    useEffect(() => {
        // Force mock data on initial load to prevent empty state while fetching
        setTables(mockTables);

        if (user) {
            fetchTables();
            (async () => {
                const { data: staff } = await supabase
                    .from('restaurant_staff')
                    .select('restaurant:restaurants(slug)')
                    .eq('user_id', user.id)
                    .single();
                if (staff && staff.restaurant) {
                    setRestaurantSlug((staff.restaurant as any).slug);
                }
            })();
        }

        // Safety timeout to ensure loading state clears
        const timer = setTimeout(() => setLoading(false), 1000);
        return () => clearTimeout(timer);
    }, [user]);

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

    const fetchTables = async () => {
        try {
            if (!user) return;

            const { data: staff } = await supabase
                .from('restaurant_staff')
                .select('restaurant_id')
                .eq('user_id', user.id)
                .single();

            if (!staff) return;

            const { data } = await supabase
                .from('tables')
                .select('*')
                .eq('restaurant_id', staff.restaurant_id)
                .order('table_number');

            if (data && data.length > 0) {
                setTables(data as any);
            }
        } catch (error) {
            console.error('Error fetching tables:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddTable = async () => {
        const tableNumber = prompt("Enter table number/name (e.g., 'A1', '12'):");
        if (!tableNumber) return;

        try {
            const { data: staff } = await supabase
                .from('restaurant_staff')
                .select('restaurant_id')
                .eq('user_id', user?.id || '')
                .single();

            if (!staff) return;

            const { error } = await supabase
                .from('tables')
                .insert([{
                    restaurant_id: staff.restaurant_id,
                    table_number: tableNumber,
                    status: 'available'
                }]);

            if (error) throw error;
            // Optimistic update or wait for realtime
            if (user) fetchTables();
        } catch (err: any) {
            alert('Error adding table: ' + (err.message || 'Unknown error'));
        }
    };

    const handleDeleteTable = async (id: string, number: string) => {
        if (!confirm(`Are you sure you want to delete Table ${number}?`)) return;
        try {
            const { error } = await supabase.from('tables').delete().eq('id', id);
            if (error) throw error;
            // Optimistic update
            setTables(prev => prev.filter(t => t.id !== id));
        } catch (err: any) {
            alert('Error deleting table');
        }
    };

    // Derived from Dashboard Active Orders styling
    const getStatusColor = (status: Table['status']) => {
        switch (status) {
            case 'available': return "bg-green-50 text-green-600";
            case 'occupied': return "bg-orange-50 text-orange-600";
            case 'reserved': return "bg-blue-50 text-blue-600";
            case 'bill_requested': return "bg-purple-50 text-purple-600";
            default: return "bg-gray-50 text-gray-600";
        }
    };

    return (
        <div className="space-y-8 pb-20 min-h-screen">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-4xl font-bold text-black mb-2 tracking-tight">Tables & QR</h1>
                    <p className="text-gray-500 font-medium">Manage tables and generate QR codes.</p>
                </div>
                <button
                    onClick={handleAddTable}
                    className="h-12 px-5 bg-black text-white rounded-xl flex items-center gap-2 hover:bg-gray-800 transition-colors shadow-lg shadow-black/10 font-bold text-sm"
                >
                    <Plus className="h-4 w-4" />
                    Add Table
                </button>
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
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                {tables.map((table) => (
                    <div key={table.id} className="group relative bg-white rounded-[2.5rem] p-6 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between min-h-[240px] overflow-hidden">

                        {/* Header */}
                        <div className="flex justify-between items-start relative z-10">
                            <span className={cn(
                                "px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-sm",
                                getStatusColor(table.status)
                            )}>
                                {table.status.replace('_', ' ')}
                            </span>

                            <button
                                onClick={() => handleDeleteTable(table.id, table.table_number)}
                                className="h-8 w-8 rounded-full bg-gray-50 text-gray-400 hover:text-red-500 hover:bg-red-50 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>

                        {/* Main Content */}
                        <div className="flex flex-col items-center justify-center my-4 relative z-10">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Table</span>
                            <div className="text-6xl font-black text-gray-900 tracking-tighter" style={{ fontVariantNumeric: 'tabular-nums' }}>
                                {table.table_number}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="grid grid-cols-2 gap-3 mt-auto relative z-10 pt-4 border-t border-gray-50">
                            <button
                                onClick={() => setSelectedTableQR(table)}
                                className="h-10 rounded-xl bg-black text-white flex items-center justify-center gap-2 hover:bg-gray-800 transition-all shadow-lg shadow-black/10 text-xs font-bold group-hover:scale-[1.02]"
                            >
                                <QrCode className="h-3 w-3" />
                                QR Code
                            </button>
                            <button
                                className="h-10 rounded-xl bg-gray-100 text-gray-600 flex items-center justify-center gap-2 hover:bg-gray-200 transition-all text-xs font-bold group-hover:scale-[1.02]"
                                title="Refresh Status"
                            >
                                <RefreshCcw className="h-3 w-3" />
                                Status
                            </button>
                        </div>

                        {/* Decorative Background Gradient */}
                        <div className="absolute inset-0 bg-gradient-to-br from-transparent to-gray-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                    </div>
                ))}

                {/* Add New Table Button (as Card) */}
                <button
                    onClick={handleAddTable}
                    className="group min-h-[240px] rounded-[2.5rem] border-2 border-dashed border-gray-200 hover:border-black/20 bg-gray-50/50 flex flex-col items-center justify-center gap-4 hover:bg-gray-100 transition-all"
                >
                    <div className="h-16 w-16 rounded-full bg-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                        <Plus className="h-8 w-8 text-gray-400 group-hover:text-black" />
                    </div>
                    <span className="font-bold text-gray-400 group-hover:text-black transition-colors">Add New Table</span>
                </button>
            </div>

            {/* Table Occupancy Heatmap */}
            <TableOccupancyGraph tables={tables} />

            {/* QR Code Modal */}
            {
                selectedTableQR && restaurantSlug && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-6 animate-in fade-in duration-300">
                        <div className="bg-white w-full max-w-sm rounded-[3rem] p-8 relative shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col items-center">
                            <button
                                className="absolute right-6 top-6 h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-black hover:text-white transition-all"
                                onClick={() => setSelectedTableQR(null)}
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
                                        value={`https://gebeta.app/r/${restaurantSlug}/t/${selectedTableQR.table_number}`}
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
        </div >
    );
}
