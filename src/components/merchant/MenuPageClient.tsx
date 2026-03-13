'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import { Plus, Edit2, Trash2, Loader2, UtensilsCrossed, ArrowUp, ArrowDown } from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';
import { CategoryWithItems, MenuItem } from '@/types/database';
import { MenuItemModal } from '@/features/merchant/components/MenuItemModal';
import { toast } from 'react-hot-toast';
import {
    BulkPriceUpdate,
    InlineMenuItemPatch,
    MenuGridEditor,
} from '@/components/merchant/MenuGridEditor';
import { usePageLoadGuard } from '@/hooks/usePageLoadGuard';
import type { MenuPageData } from '@/lib/services/dashboardDataService';

interface MenuPageClientProps {
    initialData: MenuPageData | null;
}

type MenuDiffEntry = {
    label: string;
    type: 'category' | 'item';
};

type ComparableMenuItem = {
    id: string;
    category_id: string;
    name: string;
    price: number;
    description: string | null;
    is_available: boolean;
};

type ComparableCategory = {
    id: string;
    name: string;
    order_index: number;
    items: ComparableMenuItem[];
};

const buildComparableSnapshot = (input: CategoryWithItems[]): ComparableCategory[] => {
    return input.map(category => ({
        id: category.id,
        name: category.name,
        order_index: category.order_index ?? 0,
        items: category.items.map(item => ({
            id: item.id,
            category_id: item.category_id,
            name: item.name,
            price: Number(item.price ?? 0),
            description: item.description ?? null,
            is_available: item.is_available ?? true,
        })),
    }));
};

const toSnapshotString = (input: CategoryWithItems[]) =>
    JSON.stringify(buildComparableSnapshot(input));

const computeMenuDiff = (
    baseline: ComparableCategory[],
    current: ComparableCategory[]
): MenuDiffEntry[] => {
    const entries: MenuDiffEntry[] = [];

    const baselineCategories = new Map(baseline.map(category => [category.id, category]));
    const currentCategories = new Map(current.map(category => [category.id, category]));

    for (const category of current) {
        const previous = baselineCategories.get(category.id);
        if (!previous) {
            entries.push({ label: `Added category: ${category.name}`, type: 'category' });
            continue;
        }
        if (
            (previous.name ?? '') !== (category.name ?? '') ||
            (previous.order_index ?? 0) !== (category.order_index ?? 0)
        ) {
            entries.push({ label: `Updated category: ${category.name}`, type: 'category' });
        }
    }

    for (const category of baseline) {
        if (!currentCategories.has(category.id)) {
            entries.push({ label: `Removed category: ${category.name}`, type: 'category' });
        }
    }

    const baselineItems = new Map(
        baseline.flatMap(category => category.items.map(item => [item.id, item] as const))
    );
    const currentItems = new Map(
        current.flatMap(category => category.items.map(item => [item.id, item] as const))
    );

    for (const item of currentItems.values()) {
        const previous = baselineItems.get(item.id);
        if (!previous) {
            entries.push({ label: `Added item: ${item.name}`, type: 'item' });
            continue;
        }
        const changed =
            (previous.name ?? '') !== (item.name ?? '') ||
            Number(previous.price ?? 0) !== Number(item.price ?? 0) ||
            (previous.description ?? '') !== (item.description ?? '') ||
            (previous.is_available ?? true) !== (item.is_available ?? true);
        if (changed) {
            entries.push({ label: `Updated item: ${item.name}`, type: 'item' });
        }
    }

    for (const item of baselineItems.values()) {
        if (!currentItems.has(item.id)) {
            entries.push({ label: `Removed item: ${item.name}`, type: 'item' });
        }
    }

    return entries;
};

export function MenuPageClient({ initialData }: MenuPageClientProps) {
    const supabase = createClient();
    const { loading, markLoaded } = usePageLoadGuard('menu');

    const [categories, setCategories] = useState<CategoryWithItems[]>(
        initialData?.categories ?? []
    );
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [categoryMode, setCategoryMode] = useState<'create' | 'edit'>('create');
    const [categoryName, setCategoryName] = useState('');
    const [categoryNameError, setCategoryNameError] = useState<string | null>(null);
    const [categorySubmitting, setCategorySubmitting] = useState(false);
    const [deleteSubmitting, setDeleteSubmitting] = useState(false);
    const [categoryToDelete, setCategoryToDelete] = useState<ComparableCategory | null>(null);

    const [publishedSnapshot, setPublishedSnapshot] = useState<string | null>(null);
    const [previousPublishedSnapshot, setPreviousPublishedSnapshot] = useState<string | null>(null);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);
    const [isRollbacking, setIsRollbacking] = useState(false);

    // Use effect to mark as loaded when initialData is available
    useEffect(() => {
        if (initialData) {
            markLoaded();
        }
    }, [initialData, markLoaded]);

    // Initialize published snapshot from initial data
    useEffect(() => {
        if (initialData?.categories && !publishedSnapshot) {
            const snapshot = toSnapshotString(initialData.categories);
            setPublishedSnapshot(snapshot);
        }
    }, [initialData, publishedSnapshot]);

    const fetchMenu = useCallback(async () => {
        const { data, error } = await supabase
            .from('categories')
            .select(
                `
                id,
                name,
                order_index,
                menu_items (
                    id,
                    name,
                    price,
                    description,
                    is_available,
                    category_id,
                    image_url
                )
            `
            )
            .order('order_index', { ascending: true });

        if (error) {
            console.error(error);
            toast.error('Failed to load menu.');
            return [];
        }

        // Filter out categories with no items if needed, and format items
        const formatted = (data ?? []).map((cat: any) => ({
            id: cat.id,
            name: cat.name,
            order_index: cat.order_index ?? 0,
            items: (cat.menu_items ?? []).map((item: any) => ({
                id: item.id,
                name: item.name,
                price: item.price,
                description: item.description,
                is_available: item.is_available ?? true,
                category_id: item.category_id,
                image_url: item.image_url,
            })),
        }));

        setCategories(formatted);
        return formatted;
    }, [supabase]);

    useEffect(() => {
        if (!initialData?.categories) {
            fetchMenu();
        }
    }, [initialData, fetchMenu]);

    // Detect unsaved changes
    useEffect(() => {
        if (!publishedSnapshot) return;
        const currentSnapshot = toSnapshotString(categories);
        setHasUnsavedChanges(currentSnapshot !== publishedSnapshot);
    }, [categories, publishedSnapshot]);

    const diffEntries = computeMenuDiff(
        buildComparableSnapshot(publishedSnapshot ? JSON.parse(publishedSnapshot) : []),
        buildComparableSnapshot(categories)
    );

    const handleInlineItemSave = async (itemId: string, updates: InlineMenuItemPatch) => {
        setCategories(prev =>
            prev.map(cat => ({
                ...cat,
                items: cat.items.map(item => (item.id === itemId ? { ...item, ...updates } : item)),
            }))
        );

        const { error } = await supabase.from('menu_items').update(updates).eq('id', itemId);

        if (error) {
            console.error(error);
            toast.error('Failed to save item.');
            await fetchMenu();
        }
    };

    const handleBulkAvailabilityUpdate = async (itemIds: string[], isAvailable: boolean) => {
        const previousCategories = [...categories];
        setCategories(prev =>
            prev.map(cat => ({
                ...cat,
                items: cat.items.map(item =>
                    itemIds.includes(item.id) ? { ...item, is_available: isAvailable } : item
                ),
            }))
        );

        const { error } = await supabase
            .from('menu_items')
            .update({ is_available: isAvailable })
            .in('id', itemIds);

        if (error) {
            console.error(error);
            toast.error('Failed to update items.');
            setCategories(previousCategories);
        } else {
            toast.success(`Updated ${itemIds.length} items.`);
        }
    };

    const handleBulkPriceUpdate = async (updates: BulkPriceUpdate[]) => {
        const previousCategories = [...categories];

        setCategories(prev =>
            prev.map(cat => ({
                ...cat,
                items: cat.items.map(item => {
                    const update = updates.find(u => u.id === item.id);
                    return update ? { ...item, price: update.price } : item;
                }),
            }))
        );

        const updatesToApply = updates.map(update => ({
            id: update.id,
            price: update.price,
        }));

        const { error } = await supabase.from('menu_items').upsert(
            updatesToApply.map(update => ({
                id: update.id,
                price: update.price,
            })),
            { onConflict: 'id' }
        );

        if (error) {
            console.error(error);
            toast.error('Failed to update prices.');
            setCategories(previousCategories);
        } else {
            toast.success(`Updated prices for ${updates.length} items.`);
        }
    };

    const handleMoveCategory = async (categoryId: string, direction: 'up' | 'down') => {
        const currentIndex = categories.findIndex(c => c.id === categoryId);
        if (currentIndex === -1) return;

        const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
        if (newIndex < 0 || newIndex >= categories.length) return;

        const newCategories = [...categories];
        [newCategories[currentIndex], newCategories[newIndex]] = [
            newCategories[newIndex],
            newCategories[currentIndex],
        ];

        setCategories(newCategories);
    };

    const openCreateCategoryModal = () => {
        setCategoryMode('create');
        setCategoryName('');
        setCategoryNameError(null);
        setIsCategoryModalOpen(true);
    };

    const openEditCategoryModal = (category: ComparableCategory) => {
        setCategoryMode('edit');
        setCategoryName(category.name);
        setCategoryNameError(null);
        setSelectedCategory(category.id);
        setIsCategoryModalOpen(true);
    };

    const closeCategoryModal = () => {
        setIsCategoryModalOpen(false);
        setCategoryName('');
        setCategoryNameError(null);
        setSelectedCategory(null);
    };

    const handleCategorySubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!categoryName.trim()) {
            setCategoryNameError('Category name is required.');
            return;
        }

        setCategorySubmitting(true);

        try {
            if (categoryMode === 'create') {
                const { error } = await supabase
                    .from('categories')
                    .insert({ name: categoryName, restaurant_id: initialData?.restaurant_id });

                if (error) throw error;
                toast.success('Category created.');
            } else {
                const { error } = await supabase
                    .from('categories')
                    .update({ name: categoryName })
                    .eq('id', selectedCategory);

                if (error) throw error;
                toast.success('Category updated.');
            }

            closeCategoryModal();
            await fetchMenu();
        } catch (error) {
            console.error(error);
            toast.error(`Failed to ${categoryMode} category.`);
        } finally {
            setCategorySubmitting(false);
        }
    };

    const handleDeleteCategory = async () => {
        if (!categoryToDelete) return;

        setDeleteSubmitting(true);

        try {
            // Delete all items in the category first
            const { error: itemsError } = await supabase
                .from('menu_items')
                .delete()
                .eq('category_id', categoryToDelete.id);

            if (itemsError) throw itemsError;

            // Then delete the category
            const { error: categoryError } = await supabase
                .from('categories')
                .delete()
                .eq('id', categoryToDelete.id);

            if (categoryError) throw categoryError;

            toast.success('Category deleted.');
            setCategoryToDelete(null);
            await fetchMenu();
        } catch (error) {
            console.error(error);
            toast.error('Failed to delete category.');
        } finally {
            setDeleteSubmitting(false);
        }
    };

    const handlePublishMenu = async () => {
        setIsPublishing(true);

        try {
            // Save current state as published
            const currentSnapshot = toSnapshotString(categories);
            setPreviousPublishedSnapshot(publishedSnapshot);
            setPublishedSnapshot(currentSnapshot);
            setHasUnsavedChanges(false);
            setIsPublishModalOpen(false);
            toast.success('Menu published.');
        } catch (error) {
            console.error(error);
            toast.error('Failed to publish menu.');
        } finally {
            setIsPublishing(false);
        }
    };

    const handleRollbackLatestPublish = async () => {
        if (!previousPublishedSnapshot) return;

        setIsRollbacking(true);

        try {
            // Restore to previous published state
            const previousPublished = JSON.parse(previousPublishedSnapshot) as CategoryWithItems[];

            setCategories(previousPublished);

            // Update database to match
            await Promise.all(
                previousPublished.map(async (category, index) => {
                    await supabase
                        .from('categories')
                        .update({
                            name: category.name,
                            order_index: index,
                        })
                        .eq('id', category.id);

                    await Promise.all(
                        category.items.map(async item => {
                            await supabase
                                .from('menu_items')
                                .update({
                                    name: item.name,
                                    price: item.price,
                                    description: item.description,
                                    is_available: item.is_available,
                                    category_id: item.category_id,
                                })
                                .eq('id', item.id);
                        })
                    );
                })
            );

            setPublishedSnapshot(previousPublishedSnapshot);
            setPreviousPublishedSnapshot(null);
            await fetchMenu();
            toast.success('Rolled back to previous published menu.');
        } catch (error) {
            console.error(error);
            toast.error('Rollback failed. Please try again.');
        } finally {
            setIsRollbacking(false);
        }
    };

    useEffect(() => {
        if (!hasUnsavedChanges) return;

        const handler = (event: BeforeUnloadEvent) => {
            event.preventDefault();
            event.returnValue = '';
        };

        window.addEventListener('beforeunload', handler);
        return () => window.removeEventListener('beforeunload', handler);
    }, [hasUnsavedChanges]);

    if (loading) {
        return (
            <div className="min-h-screen space-y-10 bg-white pb-20">
                <div className="flex items-start justify-between">
                    <div className="space-y-2">
                        <Skeleton className="h-10 w-32 rounded-xl" />
                        <Skeleton className="h-4 w-48 rounded-lg" />
                    </div>
                    {/* Header Actions Skeleton */}
                    <div className="flex gap-3">
                        <Skeleton className="h-12 w-24 rounded-xl" />
                        <Skeleton className="h-12 w-36 rounded-xl" />
                    </div>
                </div>
                <div className="space-y-12">
                    {[1, 2].map(category => (
                        <div key={category} className="space-y-6">
                            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                                <Skeleton className="h-8 w-40 rounded-lg" />
                                <div className="flex gap-2">
                                    <Skeleton className="h-9 w-9 rounded-lg" />
                                    <Skeleton className="h-9 w-9 rounded-lg" />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                {[1, 2, 3, 4].map(item => (
                                    <div
                                        key={item}
                                        className="flex h-72 flex-col gap-4 rounded-[2rem] bg-white p-4 shadow-sm"
                                    >
                                        <Skeleton className="h-40 w-full rounded-[1.5rem]" />
                                        <div className="space-y-2">
                                            <Skeleton className="h-5 w-3/4 rounded-lg" />
                                            <Skeleton className="h-4 w-1/2 rounded-lg" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen space-y-10 bg-white pb-20">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="mb-2 text-4xl font-bold tracking-tight text-black">Menu</h1>
                    <div className="flex items-center gap-3">
                        <p className="font-medium text-gray-500">
                            Manage your categories and items.
                        </p>
                        {hasUnsavedChanges && (
                            <span className="rounded-lg bg-amber-100 px-2 py-1 text-xs font-bold tracking-wide text-amber-700 uppercase">
                                Draft Changes
                            </span>
                        )}
                    </div>
                </div>
                <div className="flex gap-3">
                    <button className="flex h-12 items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 text-sm font-bold text-black transition-colors hover:bg-gray-50">
                        Reorder
                    </button>
                    <button
                        onClick={() => setIsPublishModalOpen(true)}
                        disabled={!hasUnsavedChanges || isPublishing}
                        className="flex h-12 items-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-bold text-white shadow-lg shadow-emerald-900/10 transition-colors hover:bg-emerald-700 disabled:opacity-50"
                    >
                        {isPublishing ? 'Publishing...' : 'Publish'}
                    </button>
                    <button
                        onClick={handleRollbackLatestPublish}
                        disabled={!previousPublishedSnapshot || isRollbacking}
                        className="flex h-12 items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 text-sm font-bold text-black transition-colors hover:bg-gray-50 disabled:opacity-50"
                    >
                        {isRollbacking ? 'Rolling back...' : 'Rollback'}
                    </button>
                    <button
                        onClick={openCreateCategoryModal}
                        className="bg-brand-crimson flex h-12 items-center gap-2 rounded-xl px-5 text-sm font-bold text-white shadow-lg shadow-black/10 transition-colors hover:bg-[#a0151e]"
                    >
                        <Plus className="h-4 w-4" />
                        Add Category
                    </button>
                </div>
            </div>

            {/* Menu List */}
            <div className="space-y-12">
                {categories.map(category => (
                    <div key={category.id} className="space-y-6">
                        {/* Category Header */}
                        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                            <div className="flex items-baseline gap-4">
                                <h2 className="text-2xl font-bold tracking-tight text-gray-900">
                                    {category.name}
                                </h2>
                                <span className="rounded-full bg-gray-50 px-3 py-1 text-sm font-bold text-gray-400">
                                    {category.items.length} items
                                </span>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleMoveCategory(category.id, 'up')}
                                    disabled={categories[0]?.id === category.id}
                                    className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 transition-all hover:bg-gray-50 hover:text-black disabled:opacity-40"
                                    aria-label={`Move ${category.name} up`}
                                >
                                    <ArrowUp className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={() => handleMoveCategory(category.id, 'down')}
                                    disabled={categories[categories.length - 1]?.id === category.id}
                                    className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 transition-all hover:bg-gray-50 hover:text-black disabled:opacity-40"
                                    aria-label={`Move ${category.name} down`}
                                >
                                    <ArrowDown className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={() => openEditCategoryModal(category)}
                                    className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 transition-all hover:bg-gray-50 hover:text-black"
                                    aria-label={`Edit ${category.name}`}
                                >
                                    <Edit2 className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={() => setCategoryToDelete(category)}
                                    className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 transition-all hover:bg-red-50 hover:text-red-500"
                                    aria-label={`Delete ${category.name}`}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        </div>

                        {/* Items Grid */}
                        <MenuGridEditor
                            category={category}
                            readOnly={false}
                            onAddItem={selected => {
                                setSelectedCategory(selected);
                                setEditingItem(null);
                                setIsModalOpen(true);
                            }}
                            onOpenAdvancedEdit={(selected, item) => {
                                setSelectedCategory(selected);
                                setEditingItem(item);
                                setIsModalOpen(true);
                            }}
                            onSaveInline={handleInlineItemSave}
                            onBulkAvailabilityUpdate={handleBulkAvailabilityUpdate}
                            onBulkPriceUpdate={handleBulkPriceUpdate}
                        />
                    </div>
                ))}

                {categories.length === 0 && !loading && (
                    <div className="flex flex-col items-center justify-center rounded-[2.5rem] border border-dashed border-gray-200 bg-gray-50 py-20 text-center">
                        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-sm">
                            <UtensilsCrossed className="h-8 w-8 text-gray-400" />
                        </div>
                        <h3 className="mb-2 text-xl font-bold text-gray-900">No categories yet</h3>
                        <p className="mb-8 max-w-sm font-medium text-gray-500">
                            Start building your menu by adding your first category.
                        </p>
                        <button
                            onClick={openCreateCategoryModal}
                            className="bg-brand-crimson h-12 rounded-xl px-8 font-bold text-white shadow-lg shadow-black/10 transition-colors hover:bg-[#a0151e]"
                        >
                            Create Category
                        </button>
                    </div>
                )}
            </div>

            <MenuItemModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setEditingItem(null);
                    setSelectedCategory(null);
                }}
                category={selectedCategory}
                itemToEdit={editingItem}
                onSuccess={() => {
                    fetchMenu();
                    setIsModalOpen(false);
                }}
            />

            {isCategoryModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
                        <h3 className="text-xl font-bold text-gray-900">
                            {categoryMode === 'edit' ? 'Edit category' : 'Create category'}
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                            {categoryMode === 'edit'
                                ? 'Update the category name.'
                                : 'Add a new menu category for your items.'}
                        </p>

                        <form onSubmit={handleCategorySubmit} className="mt-6 space-y-4">
                            <div className="space-y-2">
                                <label
                                    htmlFor="category-name"
                                    className="text-sm font-medium text-gray-700"
                                >
                                    Category name
                                </label>
                                <input
                                    id="category-name"
                                    value={categoryName}
                                    onChange={event => {
                                        setCategoryName(event.target.value);
                                        if (categoryNameError) setCategoryNameError(null);
                                    }}
                                    placeholder="e.g. Starters"
                                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400"
                                    maxLength={100}
                                    disabled={categorySubmitting}
                                    autoFocus
                                />
                                {categoryNameError && (
                                    <p className="text-xs text-red-600">{categoryNameError}</p>
                                )}
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => closeCategoryModal()}
                                    disabled={categorySubmitting}
                                    className="h-10 rounded-xl border border-gray-200 px-4 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={categorySubmitting}
                                    className="bg-brand-crimson inline-flex h-10 min-w-28 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold text-white hover:bg-[#a0151e] disabled:opacity-50"
                                >
                                    {categorySubmitting && (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    )}
                                    {categoryMode === 'edit' ? 'Save' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {categoryToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
                        <h3 className="text-xl font-bold text-gray-900">Delete category</h3>
                        <p className="mt-2 text-sm text-gray-600">
                            Delete{' '}
                            <span className="font-semibold text-gray-900">
                                {categoryToDelete.name}
                            </span>{' '}
                            and its{' '}
                            <span className="font-semibold text-gray-900">
                                {categoryToDelete.items.length}
                            </span>{' '}
                            item(s)?
                        </p>
                        <p className="mt-1 text-sm text-red-600">This action cannot be undone.</p>

                        <div className="mt-6 flex items-center justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setCategoryToDelete(null)}
                                disabled={deleteSubmitting}
                                className="h-10 rounded-xl border border-gray-200 px-4 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleDeleteCategory}
                                disabled={deleteSubmitting}
                                className="inline-flex h-10 min-w-28 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                            >
                                {deleteSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isPublishModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-xl">
                        <h3 className="text-xl font-bold text-gray-900">Publish menu changes</h3>
                        <p className="mt-1 text-sm text-gray-600">
                            Review draft differences before publishing this menu version.
                        </p>

                        <div className="mt-4 rounded-2xl border border-gray-200 p-4">
                            <p className="mb-2 text-xs font-semibold tracking-wide text-gray-500 uppercase">
                                Change preview ({diffEntries.length})
                            </p>
                            <div className="max-h-56 space-y-1 overflow-y-auto">
                                {diffEntries.length === 0 && (
                                    <p className="text-sm text-gray-500">
                                        No visible diffs detected.
                                    </p>
                                )}
                                {diffEntries.map((entry, index) => (
                                    <p
                                        key={`${entry.label}-${index}`}
                                        className="text-sm text-gray-700"
                                    >
                                        {entry.label}
                                    </p>
                                ))}
                            </div>
                        </div>

                        <div className="mt-6 flex items-center justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setIsPublishModalOpen(false)}
                                disabled={isPublishing}
                                className="h-10 rounded-xl border border-gray-200 px-4 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handlePublishMenu}
                                disabled={isPublishing || !hasUnsavedChanges}
                                className="inline-flex h-10 items-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                            >
                                {isPublishing && <Loader2 className="h-4 w-4 animate-spin" />}
                                Publish
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
