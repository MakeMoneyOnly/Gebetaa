'use client';

import React, { useState } from 'react';
import {
    Bell,
    MoreHorizontal,
    MessageSquare,
    CheckCircle2,
    FileText,
} from 'lucide-react';
import { useMerchantActivity } from '@/hooks/useMerchantActivity';
import { toast } from 'react-hot-toast';
import { Skeleton } from '@/components/ui/Skeleton';

export function RightPanel() {
    const { activities, loading, restaurantName, restaurantHandle, broadcastMessage } = useMerchantActivity();
    const [broadcastInput, setBroadcastInput] = useState('');

    const handleBroadcast = async () => {
        if (!broadcastInput.trim()) return;

        const success = await broadcastMessage(broadcastInput);
        if (success) {
            toast.success('Broadcast sent to staff!', {
                icon: '📢',
            });
            setBroadcastInput('');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleBroadcast();
        }
    };

    const handleNotificationClick = () => {
        toast('No new notifications', {
            icon: '🔔',
        });
    };

    const handleMessageClick = () => {
        toast('No new messages', {
            icon: '💬',
        });
    };

    const handleMoreClick = () => {
        toast('Settings menu', {
            icon: '⚙️',
        });
    };

    return (
        <aside className="hidden xl:flex flex-col w-[380px] bg-white border-l border-[#F1F1F1] h-screen fixed right-0 top-0 p-8 z-30 shadow-[-4px_0_24px_-12px_rgba(0,0,0,0.02)]">

            {/* Profile Section */}
            <div className="bg-[#F8F9FA] rounded-[2.5rem] p-8 text-center mb-10 relative group hover:shadow-sm transition-shadow">

                {/* Avatar */}
                <div className="relative inline-block mb-4">
                    <div className="h-24 w-24 rounded-full p-1 bg-white mx-auto shadow-sm ring-4 ring-white">
                        <img
                            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${restaurantName}`}
                            alt="Profile"
                            className="h-full w-full rounded-full bg-red-50 object-cover"
                        />
                    </div>
                    {loading ? (
                        <div className="absolute bottom-2 right-0 h-6 w-6 bg-gray-300 rounded-full border-4 border-[#F8F9FA] animate-pulse" />
                    ) : (
                        <div className="absolute bottom-2 right-0 h-6 w-6 bg-green-500 rounded-full border-4 border-[#F8F9FA] animate-pulse" />
                    )}
                </div>

                {/* Name & Handle */}
                {loading ? (
                    <div className="flex flex-col items-center gap-2 mb-8">
                        <Skeleton className="h-6 w-32" />
                        <Skeleton className="h-4 w-24" />
                    </div>
                ) : (
                    <>
                        <h2 className="text-xl font-bold text-black mb-1 tracking-tight">{restaurantName}</h2>
                        <p className="text-gray-400 text-sm mb-8 font-medium">{restaurantHandle}</p>
                    </>
                )}

                {/* Buttons Row */}
                <div className="flex justify-center gap-4 relative">
                    <button
                        onClick={handleNotificationClick}
                        className="h-12 w-12 rounded-full bg-white flex items-center justify-center text-gray-700 hover:text-black hover:shadow-md hover:-translate-y-1 transition-all shadow-sm border border-gray-100 active:scale-95 group/btn"
                    >
                        <Bell className="h-5 w-5 transition-transform group-hover/btn:swing" />
                    </button>

                    <button
                        onClick={handleMessageClick}
                        className="h-12 w-12 rounded-full bg-white flex items-center justify-center text-gray-700 hover:text-black hover:shadow-md hover:-translate-y-1 transition-all shadow-sm border border-gray-100 active:scale-95 group/btn"
                    >
                        <MessageSquare className="h-5 w-5 transition-transform group-hover/btn:scale-110" />
                    </button>

                    <button
                        onClick={handleMoreClick}
                        className="h-12 w-12 rounded-full bg-white flex items-center justify-center text-gray-700 hover:text-black hover:shadow-md hover:-translate-y-1 transition-all shadow-sm border border-gray-100 active:scale-95 group/btn"
                    >
                        <MoreHorizontal className="h-5 w-5 transition-transform group-hover/btn:rotate-90" />
                    </button>
                </div>
            </div>

            {/* Activity Stream */}
            <div className="flex-1 flex flex-col min-h-0">
                <div className="flex items-center justify-between mb-8 sticky top-0 bg-white z-10 py-2">
                    <h3 className="font-bold text-lg text-gray-800 tracking-tight">Recent Activity</h3>
                    <div className="h-1 w-12 bg-gray-100 rounded-full" />
                </div>

                <div className="space-y-8 relative flex-1 overflow-y-auto pr-2 pb-4 no-scrollbar">
                    {/* Vertical Line */}
                    <div className="absolute left-[18px] top-4 bottom-4 w-[2px] bg-gray-100/50" />

                    {loading ? (
                        /* Skeleton Loader */
                        <div className="space-y-10 pt-2">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="pl-12 relative">
                                    <Skeleton className="absolute left-0 top-1 h-3 w-3 rounded-full" />
                                    <div className="flex justify-between items-center mb-3">
                                        <Skeleton className="h-4 w-24 rounded-md" />
                                        <Skeleton className="h-3 w-12 rounded-md" />
                                    </div>
                                    <Skeleton className="h-4 w-full mb-3 rounded-md" />
                                    <Skeleton className="h-16 w-full rounded-2xl" />
                                </div>
                            ))}
                        </div>
                    ) : activities.length === 0 ? (
                        <div className="text-center py-10 pl-8">
                            <p className="text-gray-400 text-sm font-medium">No recent activity.</p>
                        </div>
                    ) : (
                        activities.map((item) => (
                            <div key={item.id} className="relative pl-12 group animate-in slide-in-from-bottom-2 duration-300">
                                {/* Dot Color based on activity type */}
                                <div className={`absolute left-0 top-1.5 h-3 w-3 rounded-full z-10 ring-4 ring-white ${item.type === 'order' ? 'bg-red-500 shadow-sm shadow-red-200' :
                                    item.type === 'kitchen' ? 'bg-green-500 shadow-sm shadow-green-200' :
                                        item.type === 'request' ? 'bg-orange-500 shadow-sm shadow-orange-200' :
                                            'bg-blue-500 shadow-sm shadow-blue-200'
                                    } transition-all group-hover:scale-125`} />

                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-bold text-sm text-gray-900 group-hover:text-black transition-colors">{item.user}</h4>
                                    </div>
                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider bg-gray-50 px-2 py-1 rounded-md">{item.time}</span>
                                </div>

                                <p className="text-sm text-gray-500 mb-4 font-medium leading-relaxed">
                                    {item.action} <span className="text-blue-600 font-bold hover:underline cursor-pointer decoration-2 underline-offset-2">{item.target}</span>
                                </p>

                                {item.hasMessage && (
                                    <div className="bg-[#EEF2FF] p-4 rounded-2xl rounded-tl-none text-sm text-[#4F46E5] font-medium leading-relaxed mb-2 relative group-hover:shadow-md transition-shadow">
                                        "{item.message}"
                                        <div className="absolute -bottom-2 -right-2 bg-yellow-400 rounded-full p-1.5 border-4 border-white shadow-sm">
                                            <span role="img" aria-label="note" className="text-xs block">📝</span>
                                        </div>
                                    </div>
                                )}

                                {item.hasFile && (
                                    <div className="bg-green-50 p-4 rounded-2xl flex items-center gap-4 cursor-pointer hover:bg-green-100 transition-colors group/file border border-green-100">
                                        <div className="h-10 w-10 bg-black rounded-xl flex items-center justify-center text-white shadow-md shadow-black/10 group-hover/file:scale-110 transition-transform">
                                            <FileText className="h-5 w-5 text-green-400" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-bold text-sm text-gray-900 line-clamp-1">{item.fileName}</p>
                                            <p className="text-[10px] uppercase font-bold text-gray-400 mt-0.5">{item.fileSize}</p>
                                        </div>
                                        <div className="h-8 w-8 rounded-full border border-green-200 bg-white flex items-center justify-center text-green-500 shadow-sm">
                                            <CheckCircle2 className="h-4 w-4" />
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>

                {/* Input Area (Reverted Design with Pink Icon/No Border) */}
                <div className="mt-auto pt-6 bg-white relative">
                    <div className="relative group">
                        <input
                            type="text"
                            placeholder="Type a quick broadcast to staff..."
                            value={broadcastInput}
                            onChange={(e) => setBroadcastInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="w-full bg-[#F8F9FA] pl-6 pr-12 py-4 rounded-2xl text-sm font-medium focus:outline-none focus:ring-0 transition-all placeholder:text-gray-400 shadow-inner"
                        />

                        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-3 text-gray-400">
                            <button
                                onClick={handleBroadcast}
                                className="hover:text-black transition-transform hover:scale-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={!broadcastInput.trim()}
                            >
                                <span role="img" aria-label="emoji" className="text-2xl filter contrast-125 hover:brightness-110 transition-all shadow-sm">📢</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </aside>
    );
}
