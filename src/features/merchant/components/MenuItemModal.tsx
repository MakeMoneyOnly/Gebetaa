'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loader2, X, Upload, Image as ImageIcon } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { CategoryWithItems, MenuItem } from '@/types/database';

interface MenuItemModalProps {
    isOpen: boolean;
    onClose: () => void;
    category: CategoryWithItems | null;
    itemToEdit?: MenuItem | null;
    onSuccess: () => void;
}

export function MenuItemModal({ isOpen, onClose, category, itemToEdit, onSuccess }: MenuItemModalProps) {
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);

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
                setPrice(itemToEdit.price.toString());
                setDescription(itemToEdit.description || '');
                setImageUrl(itemToEdit.image_url || '');
            } else {
                setName('');
                setNameAm('');
                setPrice('');
                setDescription('');
                setImageUrl('');
            }
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
            const { data } = supabase.storage
                .from('menu-items')
                .getPublicUrl(filePath);

            setImageUrl(data.publicUrl);
        } catch (error: any) {
            alert('Error uploading image: ' + error.message);
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!category && !itemToEdit) return; // Should have one or the other

        try {
            setLoading(true);

            const itemData = {
                category_id: category?.id || itemToEdit?.category_id,
                // We fallback to checking itemToEdit, but TypeScript might not know it has restaurant_id if the type is strict.
                // However, we can fetch it or trust the input. 
                // Let's assume the user is authorized via RLS anyway.
                restaurant_id: category?.restaurant_id || (itemToEdit as any)?.restaurant_id,
                name,
                name_am: nameAm || null,
                description: description || null,
                price: parseFloat(price),
                image_url: imageUrl || null
            };

            if (itemToEdit) {
                const { error } = await supabase
                    .from('menu_items')
                    .update(itemData)
                    .eq('id', itemToEdit.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('menu_items')
                    .insert([itemData]);
                if (error) throw error;
            }

            onSuccess();
            onClose();
        } catch (error: any) {
            alert('Error saving item: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <Card className="w-full max-w-lg p-6 relative animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
                <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-4 top-4 h-8 w-8 p-0"
                    onClick={onClose}
                >
                    <X className="h-4 w-4" />
                </Button>

                <h2 className="text-xl font-bold text-text-primary mb-6">
                    {itemToEdit ? 'Edit Item' : `Add Item to ${category?.name}`}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Image Upload */}
                    <div className="flex flex-col items-center gap-4 p-4 border-2 border-dashed border-surface-200 rounded-xl bg-surface-50">
                        {imageUrl ? (
                            <div className="relative h-32 w-full">
                                <img src={imageUrl} alt="Preview" className="h-full w-full object-contain rounded-lg" />
                                <button
                                    type="button"
                                    onClick={() => setImageUrl('')}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center">
                                <div className="p-3 bg-surface-100 rounded-full mb-2">
                                    <ImageIcon className="h-6 w-6 text-text-tertiary" />
                                </div>
                                <span className="text-sm text-text-secondary">Upload Item Image</span>
                            </div>
                        )}

                        <div className="relative">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                disabled={uploading}
                            />
                            <Button type="button" variant="secondary" size="sm" isLoading={uploading}>
                                <Upload className="h-4 w-4 mr-2" />
                                {uploading ? 'Uploading...' : 'Choose File'}
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-text-secondary">Name (English)</label>
                            <input
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-surface-200 bg-surface-50 focus:border-brand-crimson focus:outline-none"
                                placeholder="e.g. Burger"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-text-secondary">Name (Amharic)</label>
                            <input
                                value={nameAm}
                                onChange={(e) => setNameAm(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-surface-200 bg-surface-50 focus:border-brand-crimson focus:outline-none font-amharic"
                                placeholder="e.g. በርገር"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-text-secondary">Price (ETB)</label>
                        <input
                            required
                            type="number"
                            min="0"
                            step="0.01"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-surface-200 bg-surface-50 focus:border-brand-crimson focus:outline-none"
                            placeholder="0.00"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-text-secondary">Description</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-surface-200 bg-surface-50 focus:border-brand-crimson focus:outline-none min-h-[100px]"
                            placeholder="Describe the dish..."
                        />
                    </div>

                    <div className="pt-4 flex gap-3">
                        <Button type="button" variant="ghost" className="flex-1" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" className="flex-1 bg-brand-crimson text-white hover:bg-brand-crimson-hover" isLoading={loading}>
                            {itemToEdit ? 'Save Changes' : 'Create Item'}
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
}
