'use client';

import React from 'react';
import { Search, Tag, EyeOff, FolderOutput } from 'lucide-react';

export function MenuBulkEditTab({ initialData }: { initialData?: any }) {
    const categories = initialData?.categories || [];
    const allItems = categories.flatMap((cat: any) => 
        (cat.items || []).map((item: any) => ({ ...item, categoryName: cat.name }))
    );

    return (
        <div className="flex flex-col gap-6 max-w-6xl">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Bulk Edit</h2>
                    <p className="text-sm font-medium text-gray-500 mt-1">Make changes to multiple items at once</p>
                </div>
            </div>

            {/* Action Bar */}
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input 
                        type="text" 
                        placeholder="Search items to select..." 
                        className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                    />
                </div>
                <div className="h-10 w-px bg-gray-200 mx-1 hidden sm:block" />
                <button className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 hover:text-black px-4 py-2 rounded-xl text-sm font-bold hover:bg-gray-50 transition-colors shadow-sm">
                    <Tag className="h-4 w-4" />
                    Change Prices
                </button>
                <button className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 hover:text-black px-4 py-2 rounded-xl text-sm font-bold hover:bg-gray-50 transition-colors shadow-sm">
                    <EyeOff className="h-4 w-4" />
                    Set Availability
                </button>
                <button className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 hover:text-black px-4 py-2 rounded-xl text-sm font-bold hover:bg-gray-50 transition-colors shadow-sm">
                    <FolderOutput className="h-4 w-4" />
                    Move Category
                </button>
            </div>

            {/* Data Grid Placeholder */}
            <div className="bg-white rounded-[2rem] border-b border-gray-100 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                            <th className="px-4 py-4 w-12 text-center">
                                <input type="checkbox" className="rounded text-black focus:ring-black" />
                            </th>
                            <th className="px-4 py-4 text-xs font-bold text-gray-500">Item Name</th>
                            <th className="px-4 py-4 text-xs font-bold text-gray-500">Category</th>
                            <th className="px-4 py-4 text-xs font-bold text-gray-500 text-right">Price (ETB)</th>
                            <th className="px-4 py-4 text-xs font-bold text-gray-500">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {allItems.length > 0 ? allItems.map((item: any, idx: number) => (
                            <tr key={item.id || idx} className="hover:bg-gray-50 transition-colors">
                                <td className="px-4 py-3 text-center">
                                    <input type="checkbox" className="rounded text-black focus:ring-black" />
                                </td>
                                <td className="px-4 py-3">
                                    <span className="font-bold text-gray-900">{item.name}</span>
                                </td>
                                <td className="px-4 py-3">
                                    <span className="text-sm font-medium text-gray-600">{item.categoryName}</span>
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <span className="text-sm font-bold text-gray-900">{item.price ?? '-'}</span>
                                </td>
                                <td className="px-4 py-3">
                                    <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${item.is_available ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                        {item.is_available ? 'Available' : 'Unavailable'}
                                    </span>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500">
                                    No items found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            
            <div className="flex items-center justify-between text-sm text-gray-500 font-medium px-2">
                <span>0 items selected</span>
                <span>Showing {allItems.length} of {allItems.length} items</span>
            </div>
        </div>
    );
}
