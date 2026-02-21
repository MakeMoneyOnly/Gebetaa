'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Boxes } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { InventoryTable, type InventoryItemRow } from '@/components/merchant/InventoryTable';
import { InvoiceReviewQueue, type InvoiceRow } from '@/components/merchant/InvoiceReviewQueue';
import { LowStockAlertPanel } from '@/components/merchant/LowStockAlertPanel';
import {
    PurchaseOrderBoard,
    type PurchaseOrderRow,
} from '@/components/merchant/PurchaseOrderBoard';
import {
    RecipeMapper,
    type RecipeInventoryOption,
    type RecipeRow,
} from '@/components/merchant/RecipeMapper';
import {
    VarianceDashboard,
    type VarianceRow,
    type VarianceTotals,
} from '@/components/merchant/VarianceDashboard';
import { useAppLocale } from '@/hooks/useAppLocale';
import { usePageLoadGuard } from '@/hooks/usePageLoadGuard';
import { getP2Copy } from '@/lib/i18n/p2';

export default function InventoryPage() {
    const locale = useAppLocale();
    const copy = getP2Copy(locale);
    const { loading, markLoaded } = usePageLoadGuard('inventory');
    const [error, setError] = useState<string | null>(null);

    const [items, setItems] = useState<InventoryItemRow[]>([]);
    const [recipes, setRecipes] = useState<RecipeRow[]>([]);
    const [inventoryOptions, setInventoryOptions] = useState<RecipeInventoryOption[]>([]);
    const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrderRow[]>([]);
    const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
    const [varianceRows, setVarianceRows] = useState<VarianceRow[]>([]);
    const [varianceTotals, setVarianceTotals] = useState<VarianceTotals | null>(null);

    const [creatingItem, setCreatingItem] = useState(false);
    const [movementSubmittingId, setMovementSubmittingId] = useState<string | null>(null);
    const [creatingRecipe, setCreatingRecipe] = useState(false);
    const [creatingPurchaseOrder, setCreatingPurchaseOrder] = useState(false);
    const [creatingInvoice, setCreatingInvoice] = useState(false);
    const [refreshToken, setRefreshToken] = useState(0);

    const loadAll = useCallback(async () => {
        try {
            setError(null);
            const [itemsRes, recipesRes, posRes, invoicesRes, varianceRes] = await Promise.all([
                fetch('/api/inventory/items?limit=200', { method: 'GET', cache: 'no-store' }),
                fetch('/api/inventory/recipes', { method: 'GET', cache: 'no-store' }),
                fetch('/api/inventory/purchase-orders?limit=100', {
                    method: 'GET',
                    cache: 'no-store',
                }),
                fetch('/api/inventory/invoices?limit=100', { method: 'GET', cache: 'no-store' }),
                fetch('/api/inventory/variance?limit=200', { method: 'GET', cache: 'no-store' }),
            ]);

            const [itemsPayload, recipesPayload, posPayload, invoicesPayload, variancePayload] =
                await Promise.all([
                    itemsRes.json(),
                    recipesRes.json(),
                    posRes.json(),
                    invoicesRes.json(),
                    varianceRes.json(),
                ]);

            if (!itemsRes.ok) {
                throw new Error(itemsPayload?.error ?? 'Failed to load inventory items.');
            }
            if (!recipesRes.ok) {
                throw new Error(recipesPayload?.error ?? 'Failed to load recipes.');
            }
            if (!posRes.ok) {
                throw new Error(posPayload?.error ?? 'Failed to load purchase orders.');
            }
            if (!invoicesRes.ok) {
                throw new Error(invoicesPayload?.error ?? 'Failed to load invoices.');
            }
            if (!varianceRes.ok) {
                throw new Error(variancePayload?.error ?? 'Failed to load variance.');
            }

            setItems((itemsPayload?.data?.items ?? []) as InventoryItemRow[]);
            setRecipes((recipesPayload?.data?.recipes ?? []) as RecipeRow[]);
            setInventoryOptions(
                (recipesPayload?.data?.inventory_items ?? []) as RecipeInventoryOption[]
            );
            setPurchaseOrders((posPayload?.data?.purchase_orders ?? []) as PurchaseOrderRow[]);
            setInvoices((invoicesPayload?.data?.invoices ?? []) as InvoiceRow[]);
            setVarianceRows((variancePayload?.data?.rows ?? []) as VarianceRow[]);
            setVarianceTotals((variancePayload?.data?.totals ?? null) as VarianceTotals | null);
        } catch (loadError) {
            console.error(loadError);
            const message =
                loadError instanceof Error
                    ? loadError.message
                    : 'Failed to load inventory and cost data.';
            setError(message);
            setItems([]);
            setRecipes([]);
            setInventoryOptions([]);
            setPurchaseOrders([]);
            setInvoices([]);
            setVarianceRows([]);
            setVarianceTotals(null);
        } finally {
            markLoaded();
        }
    }, [markLoaded]);

    useEffect(() => {
        void loadAll();
    }, [loadAll, refreshToken]);

    const refresh = () => setRefreshToken(value => value + 1);

    const lowStockItems = useMemo(() => {
        return items.filter(item => Number(item.current_stock) <= Number(item.reorder_level));
    }, [items]);

    const handleCreateItem = async (payload: {
        name: string;
        sku?: string;
        uom: string;
        current_stock: number;
        reorder_level: number;
        cost_per_unit: number;
    }) => {
        try {
            setCreatingItem(true);
            const response = await fetch('/api/inventory/items', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result?.error ?? 'Failed to create inventory item.');
            }
            toast.success('Inventory item created.');
            refresh();
        } catch (createError) {
            toast.error(
                createError instanceof Error
                    ? createError.message
                    : 'Failed to create inventory item.'
            );
        } finally {
            setCreatingItem(false);
        }
    };

    const handleCreateMovement = async (payload: {
        inventory_item_id: string;
        movement_type: 'in' | 'out' | 'waste';
        qty: number;
        reason: string;
    }) => {
        try {
            setMovementSubmittingId(payload.inventory_item_id);
            const response = await fetch('/api/inventory/movements', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result?.error ?? 'Failed to record stock movement.');
            }
            toast.success('Stock movement recorded.');
            refresh();
        } catch (movementError) {
            toast.error(
                movementError instanceof Error
                    ? movementError.message
                    : 'Failed to record stock movement.'
            );
        } finally {
            setMovementSubmittingId(null);
        }
    };

    const handleCreateRecipe = async (payload: {
        name: string;
        output_qty: number;
        output_uom: string;
        ingredients: Array<{
            inventory_item_id: string;
            qty_per_recipe: number;
            uom: string;
            waste_pct: number;
        }>;
    }) => {
        try {
            setCreatingRecipe(true);
            const response = await fetch('/api/inventory/recipes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result?.error ?? 'Failed to create recipe mapping.');
            }
            toast.success('Recipe mapping created.');
            refresh();
        } catch (createError) {
            toast.error(
                createError instanceof Error
                    ? createError.message
                    : 'Failed to create recipe mapping.'
            );
        } finally {
            setCreatingRecipe(false);
        }
    };

    const handleCreatePurchaseOrder = async (payload: {
        supplier_name: string;
        status: 'draft' | 'submitted';
        currency: string;
        subtotal: number;
        tax_amount: number;
        expected_at?: string;
        notes?: string;
    }) => {
        try {
            setCreatingPurchaseOrder(true);
            const response = await fetch('/api/inventory/purchase-orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result?.error ?? 'Failed to create purchase order.');
            }
            toast.success('Purchase order created.');
            refresh();
        } catch (createError) {
            toast.error(
                createError instanceof Error
                    ? createError.message
                    : 'Failed to create purchase order.'
            );
        } finally {
            setCreatingPurchaseOrder(false);
        }
    };

    const handleCreateInvoice = async (payload: {
        supplier_name: string;
        status: InvoiceRow['status'];
        currency: string;
        subtotal: number;
        tax_amount: number;
        due_at?: string;
        notes?: string;
    }) => {
        try {
            setCreatingInvoice(true);
            const response = await fetch('/api/inventory/invoices', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result?.error ?? 'Failed to create supplier invoice.');
            }
            toast.success('Supplier invoice created.');
            refresh();
        } catch (createError) {
            toast.error(
                createError instanceof Error
                    ? createError.message
                    : 'Failed to create supplier invoice.'
            );
        } finally {
            setCreatingInvoice(false);
        }
    };

    return (
        <div className="min-h-screen space-y-6 pb-20">
            <div>
                <h1 className="mb-2 text-4xl font-bold tracking-tight text-black">
                    {copy.inventory.title}
                </h1>
                <p className="font-medium text-gray-500">{copy.inventory.subtitle}</p>
            </div>

            <div className="rounded-[1.5rem] border border-gray-100 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <Boxes className="h-4 w-4 text-blue-600" />
                    {copy.inventory.operationsCenter}
                </div>
            </div>

            {error ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                    {error}
                </div>
            ) : null}

            <LowStockAlertPanel loading={loading} items={lowStockItems} />

            <InventoryTable
                items={items}
                loading={loading}
                creating={creatingItem}
                movementSubmittingId={movementSubmittingId}
                onCreateItem={handleCreateItem}
                onCreateMovement={handleCreateMovement}
            />

            <RecipeMapper
                recipes={recipes}
                inventoryOptions={inventoryOptions}
                loading={loading}
                creating={creatingRecipe}
                onCreateRecipe={handleCreateRecipe}
            />

            <PurchaseOrderBoard
                orders={purchaseOrders}
                loading={loading}
                creating={creatingPurchaseOrder}
                onCreatePurchaseOrder={handleCreatePurchaseOrder}
                locale={locale}
            />

            <InvoiceReviewQueue
                invoices={invoices}
                loading={loading}
                creating={creatingInvoice}
                onCreateInvoice={handleCreateInvoice}
                locale={locale}
            />

            <VarianceDashboard
                loading={loading}
                rows={varianceRows}
                totals={varianceTotals}
                locale={locale}
            />
        </div>
    );
}
