'use client';

import { useState } from 'react';
import { BookOpen, Loader2, Plus } from 'lucide-react';

export type RecipeIngredientRow = {
    id: string;
    inventory_item_id: string;
    qty_per_recipe: number;
    uom: string;
    waste_pct: number;
};

export type RecipeRow = {
    id: string;
    menu_item_id: string | null;
    name: string;
    output_qty: number;
    output_uom: string;
    ingredients: RecipeIngredientRow[];
};

export type RecipeInventoryOption = {
    id: string;
    name: string;
    uom: string;
};

interface RecipeMapperProps {
    recipes: RecipeRow[];
    inventoryOptions: RecipeInventoryOption[];
    loading: boolean;
    creating: boolean;
    onCreateRecipe: (payload: {
        name: string;
        output_qty: number;
        output_uom: string;
        ingredients: Array<{ inventory_item_id: string; qty_per_recipe: number; uom: string; waste_pct: number }>;
    }) => Promise<void>;
}

export function RecipeMapper({
    recipes,
    inventoryOptions,
    loading,
    creating,
    onCreateRecipe,
}: RecipeMapperProps) {
    const [name, setName] = useState('');
    const [outputQty, setOutputQty] = useState('1');
    const [outputUom, setOutputUom] = useState('portion');
    const [ingredientId, setIngredientId] = useState('');
    const [ingredientQty, setIngredientQty] = useState('1');
    const [ingredientWastePct, setIngredientWastePct] = useState('0');

    const submitCreate = async () => {
        const qty = Number(outputQty);
        const ingredientQtyValue = Number(ingredientQty);
        const wastePct = Number(ingredientWastePct);
        if (!name.trim() || !ingredientId || !Number.isFinite(qty) || qty <= 0) return;
        if (!Number.isFinite(ingredientQtyValue) || ingredientQtyValue <= 0) return;
        if (!Number.isFinite(wastePct) || wastePct < 0 || wastePct > 100) return;

        const selectedItem = inventoryOptions.find((item) => item.id === ingredientId);
        if (!selectedItem) return;

        await onCreateRecipe({
            name: name.trim(),
            output_qty: qty,
            output_uom: outputUom.trim() || 'portion',
            ingredients: [
                {
                    inventory_item_id: ingredientId,
                    qty_per_recipe: ingredientQtyValue,
                    uom: selectedItem.uom,
                    waste_pct: wastePct,
                },
            ],
        });

        setName('');
        setOutputQty('1');
        setOutputUom('portion');
        setIngredientId('');
        setIngredientQty('1');
        setIngredientWastePct('0');
    };

    return (
        <section className="rounded-[2rem] border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h3 className="text-lg font-bold text-gray-900">Recipe Mapper</h3>
                    <p className="text-sm text-gray-500">Map menu output portions to inventory ingredients for cost tracking.</p>
                </div>
                <BookOpen className="h-5 w-5 text-gray-500" />
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-6">
                <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Recipe name"
                    className="h-10 rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-gray-400"
                />
                <input
                    value={outputQty}
                    onChange={(event) => setOutputQty(event.target.value)}
                    inputMode="decimal"
                    placeholder="Output qty"
                    className="h-10 rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-gray-400"
                />
                <input
                    value={outputUom}
                    onChange={(event) => setOutputUom(event.target.value)}
                    placeholder="Output UOM"
                    className="h-10 rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-gray-400"
                />
                <select
                    value={ingredientId}
                    onChange={(event) => setIngredientId(event.target.value)}
                    className="h-10 rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-gray-400"
                >
                    <option value="">Select ingredient</option>
                    {inventoryOptions.map((item) => (
                        <option key={item.id} value={item.id}>
                            {item.name}
                        </option>
                    ))}
                </select>
                <input
                    value={ingredientQty}
                    onChange={(event) => setIngredientQty(event.target.value)}
                    inputMode="decimal"
                    placeholder="Ingredient qty"
                    className="h-10 rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-gray-400"
                />
                <div className="flex gap-2">
                    <input
                        value={ingredientWastePct}
                        onChange={(event) => setIngredientWastePct(event.target.value)}
                        inputMode="decimal"
                        placeholder="Waste %"
                        className="h-10 w-full rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-gray-400"
                    />
                    <button
                        type="button"
                        onClick={submitCreate}
                        disabled={creating}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-black px-4 text-sm font-semibold text-white disabled:opacity-50"
                    >
                        {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                        Map
                    </button>
                </div>
            </div>

            {loading ? (
                <p className="mt-4 text-sm text-gray-500">Loading recipe mappings...</p>
            ) : recipes.length === 0 ? (
                <p className="mt-4 text-sm text-gray-500">No recipes mapped yet.</p>
            ) : (
                <div className="mt-4 space-y-2">
                    {recipes.map((recipe) => (
                        <div key={recipe.id} className="rounded-xl border border-gray-100 p-3">
                            <p className="text-sm font-semibold text-gray-900">
                                {recipe.name} · {Number(recipe.output_qty).toFixed(2)} {recipe.output_uom}
                            </p>
                            <div className="mt-2 space-y-1">
                                {recipe.ingredients.map((ingredient) => (
                                    <p key={ingredient.id} className="text-xs text-gray-600">
                                        Ingredient {ingredient.inventory_item_id.slice(0, 8)} ·
                                        {' '}
                                        {Number(ingredient.qty_per_recipe).toFixed(2)}
                                        {' '}
                                        {ingredient.uom}
                                        {' '}
                                        ({Number(ingredient.waste_pct).toFixed(1)}% waste)
                                    </p>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}
