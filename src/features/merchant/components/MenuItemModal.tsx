'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { X, Upload, Image as ImageIcon } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { toast } from 'react-hot-toast';

interface MenuItemModalProps {
    isOpen: boolean;
    onClose: () => void;
    category: string | null;
    categoryName?: string;
    itemToEdit?: {
        id: string;
        name: string;
        name_am?: string | null;
        price: number | null;
        description?: string | null;
        image_url?: string | null;
        category_id: string;
    } | null;
    onSuccess: () => void;
}

export function MenuItemModal({
    isOpen,
    onClose,
    category,
    categoryName,
    itemToEdit,
    onSuccess,
}: MenuItemModalProps) {
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    // Form State
    const [name, setName] = useState('');
    const [nameAm, setNameAm] = useState('');
    const [price, setPrice] = useState('');
    const [description, setDescription] = useState('');
    const [imageUrl, setImageUrl] = useState('');

    const supabase = createClient();

    // Reset or populate fields when opening
    useEffect(() => {
        if (isOpen) {
            if (itemToEdit) {
                setName(itemToEdit.name);
                setNameAm(itemToEdit.name_am || '');
                setPrice((itemToEdit.price ?? 0).toString());
                setDescription(itemToEdit.description || '');
                setImageUrl(itemToEdit.image_url || '');
            } else {
                setName('');
                setNameAm('');
                setPrice('');
                setDescription('');
                setImageUrl('');
            }
            setFormError(null);
        }
    }, [isOpen, itemToEdit]);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploading(true);
            if (!e.target.files || e.target.files.length === 0) return;

            const file = e.target.files[0];
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
            const filePath = `${fileName}`;

            // 1. Upload
            const { error: uploadError } = await supabase.storage
                .from('menu-items')
                .upload(filePath, file);

            if (uploadError) {
                // If bucket doesn't exist, this fails.
                // We should ideally create bucket or handle it.
                // Assuming "menu-items" bucket exists public.
                throw uploadError;
            }

            // 2. Get Public URL
            const { data } = supabase.storage.from('menu-items').getPublicUrl(filePath);

            setImageUrl(data.publicUrl);
        } catch (error: any) {
            toast.error(error?.message || 'Failed to upload image.');
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!category && !itemToEdit) {
            setFormError('Missing category context for this item.');
            return;
        }

        const parsedPrice = Number.parseFloat(price);
        if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
            setFormError('Price must be greater than 0.');
            return;
        }

        try {
            setLoading(true);
            setFormError(null);

            const itemData = {
                category_id: category || itemToEdit?.category_id,

                name,
                name_am: nameAm || null,
                description: description || null,
                price: parsedPrice,
                image_url: imageUrl || null,
            };

            if (itemToEdit) {
                const { error } = await supabase
                    .from('menu_items')
                    .update(itemData)
                    .eq('id', itemToEdit.id);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('menu_items').insert([itemData]);
                if (error) throw error;
            }

            onSuccess();
            onClose();
            toast.success(itemToEdit ? 'Menu item updated.' : 'Menu item created.');
        } catch (error: any) {
            toast.error(error?.message || 'Failed to save menu item.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <Card className="animate-in fade-in zoom-in relative max-h-[90vh] w-full max-w-lg overflow-y-auto p-6 duration-200">
                <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-4 right-4 h-8 w-8 p-0"
                    onClick={onClose}
                >
                    <X className="h-4 w-4" />
                </Button>

                <h2 className="text-text-primary mb-6 text-xl font-bold">
                    {itemToEdit ? 'Edit Item' : `Add Item to ${categoryName ?? 'Category'}`}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Image Upload */}
                    <div className="border-surface-200 bg-surface-50 flex flex-col items-center gap-4 rounded-xl border-2 border-dashed p-4">
                        {imageUrl ? (
                            <div className="relative h-32 w-full">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={imageUrl}
                                    alt="Preview"
                                    className="h-full w-full rounded-lg object-contain"
                                />
                                <button
                                    type="button"
                                    onClick={() => setImageUrl('')}
                                    className="absolute -top-2 -right-2 rounded-full bg-red-500 p-1 text-white shadow-md hover:bg-red-600"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center">
                                <div className="bg-surface-100 mb-2 rounded-full p-3">
                                    <ImageIcon className="text-text-tertiary h-6 w-6" />
                                </div>
                                <span className="text-text-secondary text-sm">
                                    Upload Item Image
                                </span>
                            </div>
                        )}

                        <div className="relative">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                                disabled={uploading}
                            />
                            <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                isLoading={uploading}
                            >
                                <Upload className="mr-2 h-4 w-4" />
                                {uploading ? 'Uploading...' : 'Choose File'}
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-text-secondary text-sm font-medium">
                                Name (English)
                            </label>
                            <input
                                required
                                value={name}
                                onChange={e => setName(e.target.value)}
                                className="border-surface-200 bg-surface-50 focus:border-brand-accent w-full rounded-lg border px-3 py-2 focus:outline-none"
                                placeholder="e.g. Burger"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-text-secondary text-sm font-medium">
                                Name (Amharic)
                            </label>
                            <input
                                value={nameAm}
                                onChange={e => setNameAm(e.target.value)}
                                className="border-surface-200 bg-surface-50 focus:border-brand-accent font-amharic w-full rounded-lg border px-3 py-2 focus:outline-none"
                                placeholder="e.g. በርገር"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-text-secondary text-sm font-medium">
                            Price (ETB)
                        </label>
                        <input
                            required
                            type="number"
                            min="0"
                            step="0.01"
                            value={price}
                            onChange={e => setPrice(e.target.value)}
                            className="border-surface-200 bg-surface-50 focus:border-brand-accent w-full rounded-lg border px-3 py-2 focus:outline-none"
                            placeholder="0.00"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-text-secondary text-sm font-medium">
                            Description
                        </label>
                        <textarea
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            className="border-surface-200 bg-surface-50 focus:border-brand-accent min-h-[100px] w-full rounded-lg border px-3 py-2 focus:outline-none"
                            placeholder="Describe the dish..."
                        />
                    </div>

                    {formError && (
                        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                            {formError}
                        </div>
                    )}

                    <div className="flex gap-3 pt-4">
                        <Button type="button" variant="ghost" className="flex-1" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="bg-brand-accent hover:bg-brand-accent-hover flex-1 text-black"
                            isLoading={loading}
                        >
                            {itemToEdit ? 'Save Changes' : 'Create Item'}
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
}
