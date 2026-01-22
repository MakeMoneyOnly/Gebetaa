'use client';

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { getSupabaseClient } from '@/lib/supabase/client';
import type { Restaurant } from '@/types/database';
import { Download, Plus, QrCode, Upload, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

interface Props {
    restaurants: Restaurant[];
    isAdmin: boolean;
}

export function AgencySetupClient({ restaurants, isAdmin }: Props) {
    const [selectedRestaurant, setSelectedRestaurant] = useState<string>('');
    const [tableCount, setTableCount] = useState(10);
    const [qrCodes, setQrCodes] = useState<{ table: number; url: string }[]>([]);
    const [menuText, setMenuText] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://yourdomain.com';
    const restaurant = restaurants.find(r => r.id === selectedRestaurant);

    const generateQRCodes = () => {
        if (!restaurant) return;

        const codes = Array.from({ length: tableCount }, (_, i) => ({
            table: i + 1,
            url: `${siteUrl}/${restaurant.slug}?table=${i + 1}`,
        }));
        setQrCodes(codes);
    };

    const downloadAllQRCodes = () => {
        qrCodes.forEach(({ table }) => {
            const svg = document.getElementById(`qr-${table}`);
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
                    downloadLink.download = `${restaurant?.slug}-table-${table}.png`;
                    downloadLink.href = pngFile;
                    downloadLink.click();
                };
                img.src = `data:image/svg+xml;base64,${btoa(svgData)}`;
            }
        });
    };

    const handleBulkUpload = async () => {
        if (!menuText.trim() || !selectedRestaurant) return;

        setIsUploading(true);
        setUploadStatus('idle');

        try {
            const supabase = getSupabaseClient();

            // Parse menu text
            // Expected format:
            // Category: Breakfast
            // - Dish Name | Price | Description | fasting
            // - Another Dish | Price | Description

            const lines = menuText.split('\n').filter(l => l.trim());
            let currentCategory: string | null = null;
            let categoryId: string | null = null;

            for (const line of lines) {
                const trimmed = line.trim();

                // Check if it's a category line
                if (trimmed.toLowerCase().startsWith('category:')) {
                    const categoryName = trimmed.replace(/^category:\s*/i, '').trim();

                    // Check if category exists
                    const { data: existingCat } = await supabase
                        .from('categories')
                        .select('id')
                        .eq('restaurant_id', selectedRestaurant)
                        .eq('name', categoryName)
                        .single();

                    if (existingCat) {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        categoryId = (existingCat as any).id;
                    } else {
                        // Create new category
                        const { data: newCat } = await supabase
                            .from('categories')
                            .insert({
                                restaurant_id: selectedRestaurant,
                                name: categoryName,
                                order_index: 0,
                            } as never)
                            .select('id')
                            .single();
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        categoryId = (newCat as any)?.id || null;
                    }
                    currentCategory = categoryName;
                }
                // Check if it's a dish line
                else if (trimmed.startsWith('-') && categoryId) {
                    const dishLine = trimmed.replace(/^-\s*/, '').trim();
                    const parts = dishLine.split('|').map(p => p.trim());

                    if (parts.length >= 2) {
                        const [name, priceStr, description, flags] = parts;
                        const price = parseFloat(priceStr) || 0;
                        const isFasting = flags?.toLowerCase().includes('fasting');

                        await supabase.from('items').insert({
                            category_id: categoryId,
                            name,
                            price,
                            description: description || null,
                            is_fasting: isFasting,
                            is_available: true,
                            station: 'kitchen',
                        } as never);
                    }
                }
            }

            setUploadStatus('success');
            setMenuText('');
        } catch (error) {
            console.error('Bulk upload error:', error);
            setUploadStatus('error');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[var(--background)] text-white p-6">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold mb-2">Agency Onboarding Factory</h1>
                <p className="text-white/60 mb-8">Generate QR codes and bulk upload menus for restaurants</p>

                {/* Restaurant Selector */}
                <div className="mb-8">
                    <label className="block text-sm font-medium text-white/80 mb-2">
                        Select Restaurant
                    </label>
                    <select
                        value={selectedRestaurant}
                        onChange={(e) => {
                            setSelectedRestaurant(e.target.value);
                            setQrCodes([]);
                        }}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#88F026]"
                    >
                        <option value="">Choose a restaurant...</option>
                        {restaurants.map(r => (
                            <option key={r.id} value={r.id}>{r.name} ({r.slug})</option>
                        ))}
                    </select>
                </div>

                {selectedRestaurant && (
                    <div className="grid md:grid-cols-2 gap-8">
                        {/* QR Generation */}
                        <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <QrCode className="w-5 h-5" />
                                QR Code Generator
                            </h2>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-white/80 mb-2">
                                    Number of Tables
                                </label>
                                <input
                                    type="number"
                                    min={1}
                                    max={100}
                                    value={tableCount}
                                    onChange={(e) => setTableCount(parseInt(e.target.value) || 10)}
                                    className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#88F026]"
                                />
                            </div>

                            <button
                                onClick={generateQRCodes}
                                className="w-full bg-[#88F026] text-black font-bold py-3 rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                            >
                                <Plus className="w-5 h-5" />
                                Generate QR Codes
                            </button>

                            {qrCodes.length > 0 && (
                                <div className="mt-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="text-white/60">{qrCodes.length} QR codes generated</span>
                                        <button
                                            onClick={downloadAllQRCodes}
                                            className="text-[#88F026] hover:underline flex items-center gap-1 text-sm"
                                        >
                                            <Download className="w-4 h-4" />
                                            Download All
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-3 gap-3 max-h-80 overflow-y-auto">
                                        {qrCodes.map(({ table, url }) => (
                                            <div key={table} className="bg-white p-2 rounded-lg text-center">
                                                <QRCodeSVG
                                                    id={`qr-${table}`}
                                                    value={url}
                                                    size={80}
                                                    level="M"
                                                    includeMargin={false}
                                                />
                                                <p className="text-black text-xs mt-1 font-bold">Table {table}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Bulk Upload */}
                        <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <Upload className="w-5 h-5" />
                                Bulk Menu Upload
                            </h2>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-white/80 mb-2">
                                    Paste Menu (see format below)
                                </label>
                                <textarea
                                    value={menuText}
                                    onChange={(e) => setMenuText(e.target.value)}
                                    placeholder={`Category: Breakfast
- Firfir | 120 | Traditional Ethiopian breakfast | fasting
- Eggs Benedict | 180 | Classic American-style breakfast

Category: Drinks
- Coffee | 50 | Ethiopian Buna ceremony | fasting
- Fresh Juice | 80 | Orange or mango`}
                                    rows={10}
                                    className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-[#88F026] font-mono text-sm"
                                />
                            </div>

                            <button
                                onClick={handleBulkUpload}
                                disabled={isUploading || !menuText.trim()}
                                className="w-full bg-[#88F026] text-black font-bold py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isUploading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Uploading...
                                    </>
                                ) : (
                                    <>
                                        <Upload className="w-5 h-5" />
                                        Upload Menu
                                    </>
                                )}
                            </button>

                            {uploadStatus === 'success' && (
                                <div className="mt-4 p-3 bg-green-500/20 border border-green-500/30 rounded-xl flex items-center gap-2 text-green-400">
                                    <CheckCircle className="w-5 h-5" />
                                    Menu uploaded successfully!
                                </div>
                            )}

                            {uploadStatus === 'error' && (
                                <div className="mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded-xl flex items-center gap-2 text-red-400">
                                    <AlertCircle className="w-5 h-5" />
                                    Failed to upload. Check format and try again.
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Admin: Create New Restaurant */}
                {isAdmin && (
                    <div className="mt-8 bg-white/5 rounded-2xl p-6 border border-white/10">
                        <h2 className="text-xl font-bold mb-4">Create New Restaurant</h2>
                        <p className="text-white/60 mb-4">
                            Add a new restaurant client to the system.
                        </p>
                        <NewRestaurantForm />
                    </div>
                )}
            </div>
        </div>
    );
}

function NewRestaurantForm() {
    const [name, setName] = useState('');
    const [slug, setSlug] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    const handleCreate = async () => {
        if (!name || !slug) return;

        setIsCreating(true);
        try {
            const supabase = getSupabaseClient();

            const { error } = await supabase.from('restaurants').insert({
                name,
                slug: slug.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
            } as never);

            if (error) throw error;

            // Reload page to show new restaurant
            window.location.reload();
        } catch (error) {
            console.error('Failed to create restaurant:', error);
            alert('Failed to create restaurant. Slug might already exist.');
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div className="grid md:grid-cols-3 gap-4">
            <input
                type="text"
                placeholder="Restaurant Name"
                value={name}
                onChange={(e) => {
                    setName(e.target.value);
                    setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-'));
                }}
                className="bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#88F026]"
            />
            <input
                type="text"
                placeholder="URL Slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#88F026]"
            />
            <button
                onClick={handleCreate}
                disabled={isCreating || !name || !slug}
                className="bg-[#88F026] text-black font-bold py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                {isCreating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                Create
            </button>
        </div>
    );
}
