'use client';

import React, { useState, useEffect } from 'react';
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
            (previous.description ?? null) !== (item.description ?? null) ||
            (previous.is_available ?? true) !== (item.is_available ?? true) ||
            (previous.category_id ?? null) !== (item.category_id ?? null);

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

export default function MenuPage() {
    const [categories, setCategories] = useState<CategoryWithItems[]>(() => {
        if (typeof window === 'undefined') return [];
        try {
            const cached = sessionStorage.getItem('menu.cache');
            return cached ? JSON.parse(cached) : [];
        } catch {
            return [];
        }
    });
    const [loading, setLoading] = useState(() => {
        if (typeof window === 'undefined') return true;
        // If we have data in cache, don't show skeleton
        const cached = sessionStorage.getItem('menu.cache');
        if (cached) return false;
        return sessionStorage.getItem('menu.initialLoadDone') !== '1';
    });

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<CategoryWithItems | null>(null);
    const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [categoryMode, setCategoryMode] = useState<'create' | 'edit'>('create');
    const [categoryName, setCategoryName] = useState('');
    const [categoryNameError, setCategoryNameError] = useState<string | null>(null);
    const [categorySubmitting, setCategorySubmitting] = useState(false);
    const [categoryToEdit, setCategoryToEdit] = useState<CategoryWithItems | null>(null);
    const [categoryToDelete, setCategoryToDelete] = useState<CategoryWithItems | null>(null);
    const [deleteSubmitting, setDeleteSubmitting] = useState(false);
    const [publishedSnapshot, setPublishedSnapshot] = useState<string>('');
    const [previousPublishedSnapshot, setPreviousPublishedSnapshot] = useState<string | null>(null);
    const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);
    const [isRollbacking, setIsRollbacking] = useState(false);

    const supabase = createClient();
    const currentSnapshot = toSnapshotString(categories);
    const hasUnsavedChanges = publishedSnapshot.length > 0 && currentSnapshot !== publishedSnapshot;
    const baselineCategoriesForDiff: ComparableCategory[] = publishedSnapshot
        ? (JSON.parse(publishedSnapshot) as ComparableCategory[])
        : [];
    const currentComparableSnapshot = buildComparableSnapshot(categories);
    const diffEntries = computeMenuDiff(baselineCategoriesForDiff, currentComparableSnapshot);

    useEffect(() => {
        if (!loading) {
            try {
                sessionStorage.setItem('menu.cache', JSON.stringify(categories));
            } catch {}
        }
    }, [categories, loading]);

    useEffect(() => {
        fetchMenu();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchMenu = async () => {
        try {
            const {
                data: { user },
            } = await supabase.auth.getUser();
            if (!user) {
                setCategories([]);
                return;
            }

            const { data: staff } = await supabase
                .from('restaurant_staff')
                .select('restaurant_id')
                .eq('user_id', user.id)
                .limit(1)
                .maybeSingle();

            if (!staff) {
                setCategories([]);
                return;
            }

            const { data } = await supabase
                .from('categories')
                .select('*, items:menu_items(*)')
                .eq('restaurant_id', staff.restaurant_id)
                .order('order_index');

            if (data && data.length > 0) {
                const liveCategories = data as CategoryWithItems[];
                setCategories(liveCategories);
                if (!publishedSnapshot) {
                    setPublishedSnapshot(toSnapshotString(liveCategories));
                }
            } else {
                setCategories([]);
            }
        } catch (error) {
            console.error('Error fetching menu:', error);
            toast.error('Could not load live menu data.');
            setCategories([]);
        } finally {
            setLoading(false);
            sessionStorage.setItem('menu.initialLoadDone', '1');
        }
    };

    const openCreateCategoryModal = () => {
        setCategoryMode('create');
        setCategoryToEdit(null);
        setCategoryName('');
        setCategoryNameError(null);
        setIsCategoryModalOpen(true);
    };

    const openEditCategoryModal = (category: CategoryWithItems) => {
        setCategoryMode('edit');
        setCategoryToEdit(category);
        setCategoryName(category.name);
        setCategoryNameError(null);
        setIsCategoryModalOpen(true);
    };

    const closeCategoryModal = (force = false) => {
        if (categorySubmitting && !force) return;
        setIsCategoryModalOpen(false);
        setCategoryToEdit(null);
        setCategoryName('');
        setCategoryNameError(null);
    };

    const handleCategorySubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const trimmedName = categoryName.trim();

        if (!trimmedName) {
            setCategoryNameError('Category name is required.');
            return;
        }

        try {
            setCategorySubmitting(true);
            const {
                data: { user },
            } = await supabase.auth.getUser();
            if (!user) {
                toast.error('You need to sign in to manage categories.');
                return;
            }

            const { data: staff } = await supabase
                .from('restaurant_staff')
                .select('restaurant_id')
                .eq('user_id', user.id)
                .limit(1)
                .maybeSingle();

            if (!staff) {
                toast.error('No restaurant staff profile found for this account.');
                return;
            }

            if (categoryMode === 'edit' && categoryToEdit) {
                const { error } = await supabase
                    .from('categories')
                    .update({ name: trimmedName })
                    .eq('id', categoryToEdit.id);

                if (error) throw error;
                toast.success(`Updated "${trimmedName}".`);
            } else {
                const { error } = await supabase.from('categories').insert([
                    {
                        restaurant_id: staff.restaurant_id,
                        name: trimmedName,
                        order_index: categories.length,
                    },
                ]);

                if (error) throw error;
                toast.success(`Added "${trimmedName}".`);
            }

            closeCategoryModal(true);
            fetchMenu();
        } catch (err: any) {
            toast.error(err?.message || 'Failed to save category.');
        } finally {
            setCategorySubmitting(false);
        }
    };

    const handleDeleteCategory = async () => {
        if (!categoryToDelete) return;

        try {
            setDeleteSubmitting(true);
            const { error } = await supabase
                .from('categories')
                .delete()
                .eq('id', categoryToDelete.id);
            if (error) throw error;
            toast.success(`Deleted "${categoryToDelete.name}".`);
            setCategoryToDelete(null);
            fetchMenu();
        } catch (err: any) {
            toast.error(err?.message || 'Failed to delete category.');
        } finally {
            setDeleteSubmitting(false);
        }
    };

    const handleInlineItemSave = async (item: MenuItem, patch: InlineMenuItemPatch) => {
        const updatePayload: Partial<MenuItem> = {
            name: patch.name,
            price: patch.price,
            description: patch.description,
            is_available: patch.is_available,
        };

        const { error } = await supabase.from('menu_items').update(updatePayload).eq('id', item.id);

        if (error) {
            throw new Error(error.message || 'Failed to update item.');
        }

        setCategories(previous =>
            previous.map(category => ({
                ...category,
                items: category.items.map(existingItem =>
                    existingItem.id === item.id
                        ? {
                              ...existingItem,
                              ...updatePayload,
                          }
                        : existingItem
                ),
            }))
        );

        toast.success(`Updated "${patch.name}".`);
    };

    const handleBulkAvailabilityUpdate = async (itemIds: string[], isAvailable: boolean) => {
        const { error } = await supabase
            .from('menu_items')
            .update({ is_available: isAvailable })
            .in('id', itemIds);

        if (error) {
            throw new Error(error.message || 'Failed to update availability.');
        }

        setCategories(previous =>
            previous.map(category => ({
                ...category,
                items: category.items.map(item =>
                    itemIds.includes(item.id)
                        ? {
                              ...item,
                              is_available: isAvailable,
                          }
                        : item
                ),
            }))
        );

        toast.success(
            isAvailable
                ? `Marked ${itemIds.length} item(s) as in stock.`
                : `Marked ${itemIds.length} item(s) as sold out.`
        );
    };

    const handleBulkPriceUpdate = async (updates: BulkPriceUpdate[]) => {
        await Promise.all(
            updates.map(async update => {
                const { error } = await supabase
                    .from('menu_items')
                    .update({ price: update.price })
                    .eq('id', update.itemId);

                if (error) {
                    throw new Error(error.message || 'Failed to update one or more prices.');
                }
            })
        );

        const updatesById = new Map(updates.map(update => [update.itemId, update.price]));
        setCategories(previous =>
            previous.map(category => ({
                ...category,
                items: category.items.map(item =>
                    updatesById.has(item.id)
                        ? {
                              ...item,
                              price: updatesById.get(item.id) ?? item.price,
                          }
                        : item
                ),
            }))
        );

        toast.success(`Updated prices for ${updates.length} item(s).`);
    };

    const handleMoveCategory = async (categoryId: string, direction: 'up' | 'down') => {
        const currentIndex = categories.findIndex(category => category.id === categoryId);
        if (currentIndex === -1) return;

        const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
        if (targetIndex < 0 || targetIndex >= categories.length) return;

        const reordered = [...categories];
        [reordered[currentIndex], reordered[targetIndex]] = [
            reordered[targetIndex],
            reordered[currentIndex],
        ];
        setCategories(reordered);

        try {
            const orderUpdates = reordered.map((category, index) => ({
                id: category.id,
                order_index: index,
            }));

            const { error } = await supabase
                .from('categories')
                .upsert(orderUpdates, { onConflict: 'id' });

            if (error) {
                throw new Error(error.message || 'Failed to persist category order.');
            }

            toast.success('Category order updated.');
        } catch (error: unknown) {
            const message =
                error instanceof Error ? error.message : 'Failed to reorder categories.';
            toast.error(message);
            fetchMenu();
        }
    };

    const handlePublishMenu = async () => {
        if (!hasUnsavedChanges) {
            toast('No draft changes to publish.');
            return;
        }

        try {
            setIsPublishing(true);
            setPreviousPublishedSnapshot(publishedSnapshot || null);
            setPublishedSnapshot(currentSnapshot);
            setIsPublishModalOpen(false);
            toast.success('Menu changes published.');
        } finally {
            setIsPublishing(false);
        }
    };

    const handleRollbackLatestPublish = async () => {
        if (!previousPublishedSnapshot) {
            toast.error('No previous published version available for rollback.');
            return;
        }

        try {
            setIsRollbacking(true);
            const rollbackCategories = JSON.parse(
                previousPublishedSnapshot
            ) as ComparableCategory[];

            await Promise.all(
                rollbackCategories.map(async (category, index) => {
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
                        className="flex h-12 items-center gap-2 rounded-xl bg-black px-5 text-sm font-bold text-white shadow-lg shadow-black/10 transition-colors hover:bg-gray-800"
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
                            className="h-12 rounded-xl bg-black px-8 font-bold text-white shadow-lg shadow-black/10 transition-colors hover:bg-gray-800"
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
                                    className="inline-flex h-10 min-w-28 items-center justify-center gap-2 rounded-xl bg-black px-4 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
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
