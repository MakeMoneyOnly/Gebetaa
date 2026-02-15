'use client';

import React from 'react';
import {
    Bell,
    MoreHorizontal,
    MessageSquare,
    ArrowUpRight,
    Search,
    ShoppingBag,
    Utensils,
    UserCircle,
    CheckCircle2
} from 'lucide-react';

// Tailored activity data for a restaurant platform
const activities = [
    {
        id: 1,
        user: "Order #2045",
        action: "placed for",
        target: "Table 5",
        time: "10:15 AM",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Order1",
        message: "Customer added a special note: 'Extra spicy please'",
        hasMessage: true,
        type: "order"
    },
    {
        id: 2,
        user: "Kitchen Team",
        action: "marked ready",
        target: "Order #2042",
        time: "10:10 AM",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Kitchen",
        hasFile: true,
        fileName: "Order_Summary.pdf",
        fileSize: "1.2 Mb",
        type: "kitchen"
    },
    {
        id: 3,
        user: "Abebe (Waiter)",
        action: "checked into",
        target: "Shift A",
        time: "09:45 AM",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Abebe",
        type: "staff"
    }
];

export function RightPanel() {
    return (
        <aside className="hidden xl:flex flex-col w-[380px] bg-white border-l border-[#F1F1F1] h-screen fixed right-0 top-0 overflow-y-auto p-8 z-30">

            {/* Profile Section - Tailored for Merchant */}
            <div className="bg-[#F8F9FA] rounded-[2.5rem] p-8 text-center mb-10 relative">
                <div className="relative inline-block mb-4">
                    <div className="h-24 w-24 rounded-full p-1 bg-white mx-auto shadow-sm">
                        <img
                            src="https://api.dicebear.com/7.x/avataaars/svg?seed=Saba"
                            alt="Profile"
                            className="h-full w-full rounded-full bg-red-50"
                        />
                    </div>
                    <div className="absolute bottom-2 right-0 h-6 w-6 bg-green-500 rounded-full border-4 border-[#F8F9FA]" />
                </div>

                <h2 className="text-xl font-bold text-black mb-1">Saba Grill</h2>
                <p className="text-gray-400 text-sm mb-8">@sabagrill_admin</p>

                <div className="flex justify-center gap-4">
                    <button className="h-12 w-12 rounded-full bg-white flex items-center justify-center text-gray-700 hover:text-black hover:shadow-md transition-all shadow-sm">
                        <Bell className="h-5 w-5" />
                    </button>
                    <button className="h-12 w-12 rounded-full bg-white flex items-center justify-center text-gray-700 hover:text-black hover:shadow-md transition-all shadow-sm">
                        <MessageSquare className="h-5 w-5" />
                    </button>
                    <button className="h-12 w-12 rounded-full bg-white flex items-center justify-center text-gray-700 hover:text-black hover:shadow-md transition-all shadow-sm">
                        <MoreHorizontal className="h-5 w-5" />
                    </button>
                </div>
            </div>

            {/* Activity Stream - Tailored for Restaurant Operations */}
            <div>
                <div className="flex items-center justify-between mb-8">
                    <h3 className="font-bold text-lg text-gray-800">Recent Activity</h3>
                    <div className="h-1 w-12 bg-gray-100 rounded-full" />
                </div>

                <div className="space-y-8 relative">
                    {/* Vertical Line */}
                    <div className="absolute left-[18px] top-4 bottom-4 w-[2px] bg-gray-100/50" />

                    {activities.map((item) => (
                        <div key={item.id} className="relative pl-12 group">
                            {/* Dot Color based on activity type */}
                            <div className={`absolute left-0 top-1 h-3 w-3 rounded-full z-10 ring-4 ring-white ${item.type === 'order' ? 'bg-red-400' :
                                    item.type === 'kitchen' ? 'bg-green-400' : 'bg-blue-400'
                                }`} />

                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2">
                                    <h4 className="font-bold text-sm text-gray-900">{item.user}</h4>
                                </div>
                                <span className="text-xs text-gray-400 font-medium">{item.time}</span>
                            </div>

                            <p className="text-sm text-gray-500 mb-4">
                                {item.action} <span className="text-blue-500 font-medium">{item.target}</span>
                            </p>

                            {item.hasMessage && (
                                <div className="bg-[#EEF2FF] p-4 rounded-2xl rounded-tl-none text-sm text-[#4F46E5] font-medium leading-relaxed mb-2 relative">
                                    {item.message}
                                    <div className="absolute -bottom-2 -right-2 bg-yellow-400 rounded-full p-1 border-2 border-white">
                                        <span role="img" aria-label="note">📝</span>
                                    </div>
                                </div>
                            )}

                            {item.hasFile && (
                                <div className="bg-green-50 p-4 rounded-2xl flex items-center gap-4 cursor-pointer hover:bg-green-100 transition-colors">
                                    <div className="h-10 w-10 bg-black rounded-xl flex items-center justify-center text-white">
                                        <FileText className="h-5 w-5 text-green-400" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-bold text-sm text-gray-900">{item.fileName}</p>
                                        <p className="text-xs text-gray-500">{item.fileSize}</p>
                                    </div>
                                    <div className="h-8 w-8 rounded-full border border-green-200 flex items-center justify-center text-green-500">
                                        <CheckCircle2 className="h-4 w-4" />
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Input Area */}
                <div className="mt-8 relative">
                    <input
                        type="text"
                        placeholder="Type a quick broadcast to staff..."
                        className="w-full bg-[#F8F9FA] px-6 py-4 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black/5"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-3 text-gray-400">
                        <button className="hover:text-black"><span role="img" aria-label="emoji">📢</span></button>
                    </div>
                </div>
            </div>
        </aside>
    );
}

// Helper component for missing FileText if needed, but we'll use lucide
import { FileText } from 'lucide-react';
