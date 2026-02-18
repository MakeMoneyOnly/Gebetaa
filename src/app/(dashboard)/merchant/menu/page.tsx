'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { Plus, Edit2, Trash2, Loader2, UtensilsCrossed, ArrowUp, ArrowDown } from 'lucide-react';
import { usePageLoadGuard } from '@/hooks/usePageLoadGuard';
import { Skeleton } from '@/components/ui/Skeleton';
import { CategoryWithItems, MenuItem } from '@/types/database';
import { MenuItemModal } from '@/features/merchant/components/MenuItemModal';
import { toast } from 'react-hot-toast';
import { BulkPriceUpdate, InlineMenuItemPatch, MenuGridEditor } from '@/components/merchant/MenuGridEditor';

// Mock Data
const mockCategories: any[] = [
    {
        id: 'mock-cat-1',
        name: 'Starters',
        name_am: null,
        restaurant_id: 'mock-rest-1',
        items: [
            { id: 'm1', name: 'Sambusa', price: 50, description: 'Crispy pastry filled with lentils', is_available: true, image_url: null },
            { id: 'm2', name: 'Tomato Salad', price: 120, description: 'Fresh tomatoes with onions and peppers', is_available: true, image_url: null }
        ]
    },
    {
        id: 'mock-cat-2',
        name: 'Main Course',
        name_am: null,
        restaurant_id: 'mock-rest-1',
        items: [
            { id: 'm3', name: 'Doro Wat', price: 450, description: 'Spicy chicken stew', is_available: true, image_url: null },
            { id: 'm4', name: 'Kitfo', price: 550, description: 'Minced raw beef marinated in mitmita', is_available: true, image_url: null },
            { id: 'm5', name: 'Tibbs', price: 400, description: 'Sautéed beef with vegetables', is_available: true, image_url: null }
        ]
    },
    {
        id: 'mock-cat-3',
        name: 'Drinks',
        name_am: null,
        restaurant_id: 'mock-rest-1',
        items: [
            { id: 'm6', name: 'Coffee', price: 40, description: 'Traditional Ethiopian coffee', is_available: true, image_url: null },
            { id: 'm7', name: 'Tea', price: 30, description: 'Spiced tea', is_available: true, image_url: null }
        ]
    }
];

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
    return input.map((category) => ({
        id: category.id,
        name: category.name,
        order_index: category.order_index ?? 0,
        items: category.items.map((item) => ({
            id: item.id,
            category_id: item.category_id,
            name: item.name,
            price: Number(item.price ?? 0),
            description: item.description ?? null,
            is_available: item.is_available ?? true,
        })),
    }));
};

const toSnapshotString = (input: CategoryWithItems[]) => JSON.stringify(buildComparableSnapshot(input));

const computeMenuDiff = (baseline: ComparableCategory[], current: ComparableCategory[]): MenuDiffEntry[] => {
    const entries: MenuDiffEntry[] = [];

    const baselineCategories = new Map(baseline.map((category) => [category.id, category]));
    const currentCategories = new Map(current.map((category) => [category.id, category]));

    for (const category of current) {
        const previous = baselineCategories.get(category.id);
        if (!previous) {
            entries.push({ label: `Added category: ${category.name}`, type: 'category' });
            continue;
        }
        if ((previous.name ?? '') !== (category.name ?? '') || (previous.order_index ?? 0) !== (category.order_index ?? 0)) {
            entries.push({ label: `Updated category: ${category.name}`, type: 'category' });
        }
    }

    for (const category of baseline) {
        if (!currentCategories.has(category.id)) {
            entries.push({ label: `Removed category: ${category.name}`, type: 'category' });
        }
    }

    const baselineItems = new Map(baseline.flatMap((category) => category.items.map((item) => [item.id, item] as const)));
    const currentItems = new Map(current.flatMap((category) => category.items.map((item) => [item.id, item] as const)));

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
    const [categories, setCategories] = useState<CategoryWithItems[]>([]);
    const { loading, markLoaded } = usePageLoadGuard('menu');
    const [isMockData, setIsMockData] = useState(false);
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
        fetchMenu();
        // Safety timeout — ensures loading clears even if fetch silently fails
        const timer = setTimeout(() => {
            markLoaded();
        }, 3000);
        return () => clearTimeout(timer);
    }, []);

    const fetchMenu = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                const fallback = mockCategories as CategoryWithItems[];
                setCategories(fallback);
                if (!publishedSnapshot) {
                    setPublishedSnapshot(toSnapshotString(fallback));
                }
                setIsMockData(true);
                return;
            }

            const { data: staff } = await supabase
                .from('restaurant_staff')
                .select('restaurant_id')
                .eq('user_id', user.id)
                .single();

            if (!staff) {
                const fallback = mockCategories as CategoryWithItems[];
                setCategories(fallback);
                if (!publishedSnapshot) {
                    setPublishedSnapshot(toSnapshotString(fallback));
                }
                setIsMockData(true);
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
                setIsMockData(false);
            } else {
                const fallback = mockCategories as CategoryWithItems[];
                setCategories(fallback);
                if (!publishedSnapshot) {
                    setPublishedSnapshot(toSnapshotString(fallback));
                }
                setIsMockData(true);
            }
        } catch (error) {
            console.error('Error fetching menu:', error);
            const fallback = mockCategories as CategoryWithItems[];
            setCategories(fallback);
            if (!publishedSnapshot) {
                setPublishedSnapshot(toSnapshotString(fallback));
            }
            setIsMockData(true);
            toast.error('Could not load live menu data. Showing demo menu.');
        } finally {
            markLoaded();
        }
    };

    const openCreateCategoryModal = () => {
        if (isMockData) {
            toast.error('Sign in as restaurant staff to edit live menu data.');
            return;
        }
        setCategoryMode('create');
        setCategoryToEdit(null);
        setCategoryName('');
        setCategoryNameError(null);
        setIsCategoryModalOpen(true);
    };

    const openEditCategoryModal = (category: CategoryWithItems) => {
        if (isMockData) {
            toast.error('Sign in as restaurant staff to edit live menu data.');
            return;
        }
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

        if (isMockData) {
            toast.error('Sign in as restaurant staff to edit live menu data.');
            return;
        }

        try {
            setCategorySubmitting(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                toast.error('You need to sign in to manage categories.');
                return;
            }

            const { data: staff } = await supabase
                .from('restaurant_staff')
                .select('restaurant_id')
                .eq('user_id', user.id)
                .single();

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
                const { error } = await supabase
                    .from('categories')
                    .insert([{
                        restaurant_id: staff.restaurant_id,
                        name: trimmedName,
                        order_index: categories.length
                    }]);

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
        if (isMockData) {
            toast.error('Sign in as restaurant staff to edit live menu data.');
            return;
        }

        try {
            setDeleteSubmitting(true);
            const { error } = await supabase.from('categories').delete().eq('id', categoryToDelete.id);
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
        if (isMockData) {
            throw new Error('Sign in as restaurant staff to edit live menu data.');
        }

        const updatePayload: Partial<MenuItem> = {
            name: patch.name,
            price: patch.price,
            description: patch.description,
            is_available: patch.is_available,
        };

        const { error } = await supabase
            .from('menu_items')
            .update(updatePayload)
            .eq('id', item.id);

        if (error) {
            throw new Error(error.message || 'Failed to update item.');
        }

        setCategories((previous) =>
            previous.map((category) => ({
                ...category,
                items: category.items.map((existingItem) =>
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
        if (isMockData) {
            throw new Error('Sign in as restaurant staff to edit live menu data.');
        }

        const { error } = await supabase
            .from('menu_items')
            .update({ is_available: isAvailable })
            .in('id', itemIds);

        if (error) {
            throw new Error(error.message || 'Failed to update availability.');
        }

        setCategories((previous) =>
            previous.map((category) => ({
                ...category,
                items: category.items.map((item) =>
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
        if (isMockData) {
            throw new Error('Sign in as restaurant staff to edit live menu data.');
        }

        await Promise.all(
            updates.map(async (update) => {
                const { error } = await supabase
                    .from('menu_items')
                    .update({ price: update.price })
                    .eq('id', update.itemId);

                if (error) {
                    throw new Error(error.message || 'Failed to update one or more prices.');
                }
            })
        );

        const updatesById = new Map(updates.map((update) => [update.itemId, update.price]));
        setCategories((previous) =>
            previous.map((category) => ({
                ...category,
                items: category.items.map((item) =>
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
        if (isMockData) {
            toast.error('Sign in as restaurant staff to edit live menu data.');
            return;
        }

        const currentIndex = categories.findIndex((category) => category.id === categoryId);
        if (currentIndex === -1) return;

        const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
        if (targetIndex < 0 || targetIndex >= categories.length) return;

        const reordered = [...categories];
        [reordered[currentIndex], reordered[targetIndex]] = [reordered[targetIndex], reordered[currentIndex]];
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
            const message = error instanceof Error ? error.message : 'Failed to reorder categories.';
            toast.error(message);
            fetchMenu();
        }
    };

    const handlePublishMenu = async () => {
        if (isMockData) {
            toast.error('Sign in as restaurant staff to publish menu changes.');
            return;
        }

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
        if (isMockData) {
            toast.error('Sign in as restaurant staff to rollback menu changes.');
            return;
        }

        try {
            setIsRollbacking(true);
            const rollbackCategories = JSON.parse(previousPublishedSnapshot) as ComparableCategory[];

            await Promise.all(
                rollbackCategories.map(async (category, index) => {
                    await supabase.from('categories').update({
                        name: category.name,
                        order_index: index,
                    }).eq('id', category.id);

                    await Promise.all(
                        category.items.map(async (item) => {
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
            <div className="space-y-10 pb-20 min-h-screen bg-white">
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
                    {[1, 2].map((category) => (
                        <div key={category} className="space-y-6">
                            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                                <Skeleton className="h-8 w-40 rounded-lg" />
                                <div className="flex gap-2">
                                    <Skeleton className="h-9 w-9 rounded-lg" />
                                    <Skeleton className="h-9 w-9 rounded-lg" />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {[1, 2, 3, 4].map((item) => (
                                    <div key={item} className="h-72 rounded-[2rem] p-4 flex flex-col gap-4 bg-white shadow-sm">
                                        <Skeleton className="w-full h-40 rounded-[1.5rem]" />
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
        <div className="space-y-10 pb-20 min-h-screen bg-white">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-4xl font-bold text-black mb-2 tracking-tight">Menu</h1>
                    <div className="flex items-center gap-3">
                        <p className="text-gray-500 font-medium">Manage your categories and items.</p>
                        {hasUnsavedChanges && (
                            <span className="text-xs font-bold uppercase tracking-wide text-amber-700 bg-amber-100 px-2 py-1 rounded-lg">
                                Draft Changes
                            </span>
                        )}
                    </div>
                </div>
                <div className="flex gap-3">
                    <button className="h-12 px-5 bg-white text-black border border-gray-200 rounded-xl flex items-center gap-2 hover:bg-gray-50 transition-colors font-bold text-sm">
                        Reorder
                    </button>
                    <button
                        onClick={() => setIsPublishModalOpen(true)}
                        disabled={!hasUnsavedChanges || isMockData || isPublishing}
                        className="h-12 px-5 bg-emerald-600 text-white rounded-xl flex items-center gap-2 hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-900/10 font-bold text-sm disabled:opacity-50"
                    >
                        {isPublishing ? 'Publishing...' : 'Publish'}
                    </button>
                    <button
                        onClick={handleRollbackLatestPublish}
                        disabled={!previousPublishedSnapshot || isRollbacking || isMockData}
                        className="h-12 px-5 bg-white text-black border border-gray-200 rounded-xl flex items-center gap-2 hover:bg-gray-50 transition-colors font-bold text-sm disabled:opacity-50"
                    >
                        {isRollbacking ? 'Rolling back...' : 'Rollback'}
                    </button>
                    <button
                        onClick={openCreateCategoryModal}
                        className="h-12 px-5 bg-black text-white rounded-xl flex items-center gap-2 hover:bg-gray-800 transition-colors shadow-lg shadow-black/10 font-bold text-sm"
                    >
                        <Plus className="h-4 w-4" />
                        Add Category
                    </button>
                </div>
            </div>

            {/* Menu List */}
            <div className="space-y-12">
                {categories.map((category) => (
                    <div key={category.id} className="space-y-6">
                        {/* Category Header */}
                        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                            <div className="flex items-baseline gap-4">
                                <h2 className="text-2xl font-bold text-gray-900 tracking-tight">{category.name}</h2>
                                <span className="text-sm font-bold text-gray-400 bg-gray-50 px-3 py-1 rounded-full">
                                    {category.items.length} items
                                </span>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleMoveCategory(category.id, 'up')}
                                    disabled={isMockData || categories[0]?.id === category.id}
                                    className="h-9 w-9 rounded-lg flex items-center justify-center text-gray-400 hover:text-black hover:bg-gray-50 transition-all disabled:opacity-40"
                                    aria-label={`Move ${category.name} up`}
                                >
                                    <ArrowUp className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={() => handleMoveCategory(category.id, 'down')}
                                    disabled={isMockData || categories[categories.length - 1]?.id === category.id}
                                    className="h-9 w-9 rounded-lg flex items-center justify-center text-gray-400 hover:text-black hover:bg-gray-50 transition-all disabled:opacity-40"
                                    aria-label={`Move ${category.name} down`}
                                >
                                    <ArrowDown className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={() => openEditCategoryModal(category)}
                                    className="h-9 w-9 rounded-lg flex items-center justify-center text-gray-400 hover:text-black hover:bg-gray-50 transition-all"
                                    aria-label={`Edit ${category.name}`}
                                >
                                    <Edit2 className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={() => setCategoryToDelete(category)}
                                    className="h-9 w-9 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
                                    aria-label={`Delete ${category.name}`}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        </div>

                        {/* Items Grid */}
                        <MenuGridEditor
                            category={category}
                            readOnly={isMockData}
                            onAddItem={(selected) => {
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
                    <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-gray-200 rounded-[2.5rem] bg-gray-50">
                        <div className="h-20 w-20 rounded-full bg-white flex items-center justify-center mb-6 shadow-sm">
                            <UtensilsCrossed className="h-8 w-8 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">No categories yet</h3>
                        <p className="text-gray-500 font-medium max-w-sm mb-8">Start building your menu by adding your first category.</p>
                        <button
                            onClick={openCreateCategoryModal}
                            className="h-12 px-8 bg-black text-white rounded-xl font-bold shadow-lg shadow-black/10 hover:bg-gray-800 transition-colors"
                        >
                            Create Category
                        </button>
                    </div>
                )}
            </div>

            <MenuItemModal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setEditingItem(null); setSelectedCategory(null); }}
                category={selectedCategory}
                itemToEdit={editingItem}
                onSuccess={() => { fetchMenu(); setIsModalOpen(false); }}
            />

            {isCategoryModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
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
                                <label htmlFor="category-name" className="text-sm font-medium text-gray-700">
                                    Category name
                                </label>
                                <input
                                    id="category-name"
                                    value={categoryName}
                                    onChange={(event) => {
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
                                    className="h-10 px-4 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={categorySubmitting}
                                    className="h-10 min-w-28 px-4 rounded-xl bg-black text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50 inline-flex items-center justify-center gap-2"
                                >
                                    {categorySubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                                    {categoryMode === 'edit' ? 'Save' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {categoryToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
                        <h3 className="text-xl font-bold text-gray-900">Delete category</h3>
                        <p className="mt-2 text-sm text-gray-600">
                            Delete <span className="font-semibold text-gray-900">{categoryToDelete.name}</span> and its{' '}
                            <span className="font-semibold text-gray-900">{categoryToDelete.items.length}</span> item(s)?
                        </p>
                        <p className="mt-1 text-sm text-red-600">This action cannot be undone.</p>

                        <div className="mt-6 flex items-center justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setCategoryToDelete(null)}
                                disabled={deleteSubmitting}
                                className="h-10 px-4 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleDeleteCategory}
                                disabled={deleteSubmitting}
                                className="h-10 min-w-28 px-4 rounded-xl bg-red-600 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50 inline-flex items-center justify-center gap-2"
                            >
                                {deleteSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isPublishModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-xl">
                        <h3 className="text-xl font-bold text-gray-900">Publish menu changes</h3>
                        <p className="mt-1 text-sm text-gray-600">
                            Review draft differences before publishing this menu version.
                        </p>

                        <div className="mt-4 rounded-2xl border border-gray-200 p-4">
                            <p className="text-xs uppercase tracking-wide font-semibold text-gray-500 mb-2">
                                Change preview ({diffEntries.length})
                            </p>
                            <div className="max-h-56 overflow-y-auto space-y-1">
                                {diffEntries.length === 0 && (
                                    <p className="text-sm text-gray-500">No visible diffs detected.</p>
                                )}
                                {diffEntries.map((entry, index) => (
                                    <p key={`${entry.label}-${index}`} className="text-sm text-gray-700">
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
                                className="h-10 px-4 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handlePublishMenu}
                                disabled={isPublishing || !hasUnsavedChanges}
                                className="h-10 px-4 rounded-xl bg-emerald-600 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 inline-flex items-center gap-2"
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
