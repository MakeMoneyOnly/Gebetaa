'use client';

import React, { useState } from 'react';
import { Plus, Search, ChevronRight, MoreVertical } from 'lucide-react';
import { MenuGridEditor } from './MenuGridEditor';

// Mock data to display in the editor
const mockCategory = {
    id: 'cat_1',
    name: 'Main Courses',
    sort_order: 1,
    items: [
        {
            id: 'item_1',
            name: 'Doro Wat',
            price: 450,
            description: 'Spicy chicken stew with hard-boiled eggs, served with injera.',
            is_available: true,
            image_url: 'https://images.unsplash.com/photo-1548943487-a2e4f43b4850?q=80&w=300&auto=format&fit=crop',
        },
        {
            id: 'item_2',
            name: 'Shiro',
            price: 250,
            description: 'Chickpea powder stew prepared with onions, garlic, and ginger.',
            is_available: true,
        },
        {
            id: 'item_3',
            name: 'Tibs',
            price: 550,
            description: 'Sautéed meat chunks with onions, peppers, and rosemary.',
            is_available: false,
        }
    ]
};

export function MenuManagerTab({ initialData }: { initialData?: any }) {
    const categories = initialData?.categories || [mockCategory];
    const [selectedMenu, setSelectedMenu] = useState('menu_1');
    const [selectedCategory, setSelectedCategory] = useState<string>(categories[0]?.id || mockCategory.id);

    const activeCategory = categories.find((c: any) => c.id === selectedCategory) || mockCategory;

    return (
        <div className="flex gap-8 items-start">
            {/* Sidebar (Menus & Categories) */}
            <div className="w-80 flex flex-col gap-6 shrink-0 border-r border-gray-100 pr-6 sticky top-8">
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-gray-900">Menus</h3>
                        <button className="text-black bg-[#DDF853] hover:brightness-105 rounded-lg p-1">
                            <Plus className="h-4 w-4" />
                        </button>
                    </div>
                    <div className="space-y-1">
                        <button className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${selectedMenu === 'menu_1' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'}`} onClick={() => setSelectedMenu('menu_1')}>
                            Dine-In Menu
                            {selectedMenu === 'menu_1' && <ChevronRight className="h-4 w-4 text-gray-400" />}
                        </button>
                        <button className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${selectedMenu === 'menu_2' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'}`} onClick={() => setSelectedMenu('menu_2')}>
                            Takeaway & Delivery
                            {selectedMenu === 'menu_2' && <ChevronRight className="h-4 w-4 text-gray-400" />}
                        </button>
                    </div>
                </div>

                <div className="h-px bg-gray-100" />

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-gray-900">Categories</h3>
                        <button className="text-gray-600 hover:text-black bg-gray-100 rounded-lg p-1 hover:bg-gray-200">
                            <Plus className="h-4 w-4" />
                        </button>
                    </div>
                        {categories.map((category: any) => (
                            <button 
                                key={category.id}
                                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${selectedCategory === category.id ? 'bg-black text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'}`} 
                                onClick={() => setSelectedCategory(category.id)}
                            >
                                {category.name}
                                <span className="text-xs opacity-60">{category.items?.length || 0} items</span>
                            </button>
                        ))}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col gap-6 pb-10">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">{activeCategory.name}</h2>
                        <p className="text-sm font-medium text-gray-500 mt-1">Dine-In Menu • {activeCategory.items?.length || 0} items</p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input 
                                type="text" 
                                placeholder="Search items..." 
                                className="pl-9 pr-4 py-2 w-64 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                            />
                        </div>
                        <button className="h-9 w-9 flex items-center justify-center rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50">
                            <MoreVertical className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                <MenuGridEditor 
                    category={activeCategory}
                    onAddItem={() => {}}
                    onOpenAdvancedEdit={() => {}}
                    onSaveInline={async () => {}}
                    onBulkAvailabilityUpdate={async () => {}}
                    onBulkPriceUpdate={async () => {}}
                />
            </div>
        </div>
    );
}
