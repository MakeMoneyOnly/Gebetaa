'use client';

import React from 'react';
import { Plus, Search, Edit2, Trash2 } from 'lucide-react';

export function ModifierGroupsTab() {
    return (
        <div className="flex flex-col gap-6 max-w-5xl">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Modifier Groups</h2>
                    <p className="text-sm font-medium text-gray-500 mt-1">Manage customizations and add-ons</p>
                </div>
                
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input 
                            type="text" 
                            placeholder="Search groups..." 
                            className="pl-9 pr-4 py-2 w-64 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                        />
                    </div>
                    <button className="flex items-center gap-2 bg-[#DDF853] text-black px-4 py-2 rounded-xl text-sm font-bold hover:brightness-105 transition-colors">
                        <Plus className="h-4 w-4" />
                        Add Group
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-[2rem] border-b border-gray-100 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                            <th className="px-6 py-4 text-xs font-bold text-gray-500">Group Name</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500">Rules</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500">Options</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        <tr className="hover:bg-gray-50 transition-colors group">
                            <td className="px-6 py-4">
                                <div className="flex flex-col">
                                    <span className="font-bold text-gray-900">Meat Temperature</span>
                                    <span className="text-xs text-gray-500 font-medium">Amharic: የስጋ ብስለት</span>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-red-50 text-red-700">
                                    Required (1 to 1)
                                </span>
                            </td>
                            <td className="px-6 py-4">
                                <span className="text-sm font-medium text-gray-600">4 options</span>
                            </td>
                            <td className="px-6 py-4 text-right">
                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button className="p-2 text-gray-400 hover:text-black rounded-lg hover:bg-gray-100 transition-colors">
                                        <Edit2 className="h-4 w-4" />
                                    </button>
                                    <button className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors">
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </td>
                        </tr>
                        <tr className="hover:bg-gray-50 transition-colors group">
                            <td className="px-6 py-4">
                                <div className="flex flex-col">
                                    <span className="font-bold text-gray-900">Extra Toppings</span>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-gray-100 text-gray-700">
                                    Optional (0 to 5)
                                </span>
                            </td>
                            <td className="px-6 py-4">
                                <span className="text-sm font-medium text-gray-600">8 options</span>
                            </td>
                            <td className="px-6 py-4 text-right">
                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button className="p-2 text-gray-400 hover:text-black rounded-lg hover:bg-gray-100 transition-colors">
                                        <Edit2 className="h-4 w-4" />
                                    </button>
                                    <button className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors">
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
}
