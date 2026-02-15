'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Plus, Trash2, QrCode, RefreshCcw, Loader2, X, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRole } from '@/hooks/useRole';
import { QRCodeSVG } from 'qrcode.react';

interface Table {
    id: string;
    table_number: string;
    status: 'available' | 'occupied' | 'reserved' | 'bill_requested';
    qr_code_url: string;
    active_order_id: string | null;
}

export default function TablesPage() {
    const [tables, setTables] = useState<Table[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTableQR, setSelectedTableQR] = useState<Table | null>(null);
    const [restaurantSlug, setRestaurantSlug] = useState<string | null>(null);

    const { user } = useRole(null);
    const supabase = createClient();

    useEffect(() => {
        if (user) {
            fetchTables();
            // Fetch restaurant slug for QR URL
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
    }, [user]);

    // Realtime subscription
    useEffect(() => {
        const channel = supabase
            .channel('tables-realtime')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'tables' },
                (payload) => {
                    // Simple logic: re-fetch or optimistically update. 
                    // Since "tables" table is small, re-fetching is fine and robust.
                    // Ideally we'd filter by restaurant_id, but the payload might not always have it on delete.
                    fetchTables();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [supabase]);

    const fetchTables = async () => {
        try {
            setLoading(true);
            const { data: staff } = await supabase
                .from('restaurant_staff')
                .select('restaurant_id')
                .eq('user_id', user?.id || '')
                .single();

            if (!staff) return;

            const { data, error } = await supabase
                .from('tables')
                .select('*')
                .eq('restaurant_id', staff.restaurant_id)
                .order('table_number');

            if (data) {
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
            // No need to manually fetchTables() if Realtime is working, but harmless to leave it
        } catch (err: any) {
            alert('Error adding table: ' + (err.message || 'Unknown error'));
        }
    };

    const handleDeleteTable = async (id: string, number: string) => {
        if (!confirm(`Are you sure you want to delete Table ${number}?`)) return;

        try {
            const { error } = await supabase.from('tables').delete().eq('id', id);
            if (error) throw error;
        } catch (err: any) {
            alert('Error deleting table');
        }
    };

    const downloadQR = (tableNumber: string) => {
        const svg = document.getElementById("qr-code-svg");
        if (!svg) return;
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
            downloadLink.download = `Table-${tableNumber}-QR.png`;
            downloadLink.href = pngFile;
            downloadLink.click();
        };
        img.src = "data:image/svg+xml;base64," + btoa(svgData);
    };

    if (loading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-brand-crimson" />
            </div>
        );
    }

    return (
        <div className="space-y-8 relative">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">Table Management</h1>
                    <p className="text-text-secondary">Manage physical tables and scan status</p>
                </div>
                <Button onClick={handleAddTable} className="bg-brand-crimson hover:bg-brand-crimson-hover text-white">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Table
                </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {tables.map((table) => (
                    <Card key={table.id} className="relative group overflow-hidden hover:shadow-lg transition-all border-surface-200">
                        <div className={cn(
                            "absolute top-0 inset-x-0 h-1",
                            table.status === 'available' ? "bg-green-500" :
                                table.status === 'occupied' ? "bg-red-500" :
                                    table.status === 'bill_requested' ? "bg-yellow-500" : "bg-blue-500"
                        )} />

                        <div className="p-6 flex flex-col items-center text-center space-y-4">
                            <div className="h-16 w-16 rounded-full bg-surface-100 flex items-center justify-center text-2xl font-bold text-text-primary">
                                {table.table_number}
                            </div>

                            <div>
                                <span className={cn(
                                    "px-2 py-1 rounded-full text-xs font-medium uppercase tracking-wide",
                                    table.status === 'available' ? "bg-green-100 text-green-700" :
                                        table.status === 'occupied' ? "bg-red-100 text-red-700" :
                                            table.status === 'bill_requested' ? "bg-yellow-100 text-yellow-700" : "bg-blue-100 text-blue-700"
                                )}>
                                    {table.status.replace('_', ' ')}
                                </span>
                            </div>

                            <div className="w-full pt-4 border-t border-surface-100 flex justify-between">
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    title="View QR Code"
                                    onClick={() => setSelectedTableQR(table)}
                                >
                                    <QrCode className="h-4 w-4 text-text-secondary" />
                                </Button>
                                <Button size="sm" variant="ghost" title="Reset Status">
                                    <RefreshCcw className="h-4 w-4 text-text-secondary" />
                                </Button>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-red-500 hover:bg-red-50"
                                    onClick={() => handleDeleteTable(table.id, table.table_number)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </Card>
                ))}

                {/* Add Table Empty State Card */}
                <button
                    onClick={handleAddTable}
                    className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-surface-200 bg-surface-50/50 hover:border-brand-crimson/50 hover:bg-brand-crimson/5 transition-all min-h-[200px]"
                >
                    <div className="rounded-full bg-surface-100 p-4 mb-3">
                        <Plus className="h-6 w-6 text-text-tertiary" />
                    </div>
                    <span className="font-medium text-text-secondary">Add New Table</span>
                </button>
            </div>

            {/* QR Code Modal */}
            {selectedTableQR && restaurantSlug && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <Card className="w-full max-w-md p-6 relative animate-in fade-in zoom-in duration-200">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="absolute right-4 top-4 h-8 w-8 p-0"
                            onClick={() => setSelectedTableQR(null)}
                        >
                            <X className="h-4 w-4" />
                        </Button>

                        <div className="text-center space-y-6">
                            <div>
                                <h3 className="text-xl font-bold text-text-primary">Table {selectedTableQR.table_number}</h3>
                                <p className="text-text-secondary text-sm">Scan to view menu & order</p>
                            </div>

                            <div className="flex justify-center p-4 bg-white rounded-xl border border-surface-200 mx-auto w-fit">
                                <QRCodeSVG
                                    id="qr-code-svg"
                                    value={`https://gebeta.app/r/${restaurantSlug}/t/${selectedTableQR.table_number}`}
                                    size={200}
                                    level="H"
                                    includeMargin={true}
                                />
                            </div>

                            <p className="text-xs text-text-tertiary font-mono bg-surface-50 p-2 rounded truncate max-w-full">
                                {`https://gebeta.app/r/${restaurantSlug}/t/${selectedTableQR.table_number}`}
                            </p>

                            <div className="flex gap-3 justify-center">
                                <Button
                                    variant="secondary"
                                    onClick={() => setSelectedTableQR(null)}
                                >
                                    Close
                                </Button>
                                {/* Download requires client-side image generation from SVG, slightly complex, omitting simple implementation for brevity but placeholder is here */}
                                <Button
                                    className="bg-brand-crimson text-white hover:bg-brand-crimson-hover"
                                    onClick={() => {
                                        alert("To implement robust PNG download, we need to rasterize the SVG. For now, try screenshotting or printing!");
                                    }}
                                >
                                    <Download className="mr-2 h-4 w-4" />
                                    Download PNG
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
}
