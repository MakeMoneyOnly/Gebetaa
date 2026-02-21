'use client';

import React, { useState } from 'react';
import { Bell, MoreHorizontal, MessageSquare, CheckCircle2, FileText } from 'lucide-react';
import { useMerchantActivity } from '@/hooks/useMerchantActivity';
import { toast } from 'react-hot-toast';
import { Skeleton } from '@/components/ui/Skeleton';

export function RightPanel() {
    const { activities, loading, restaurantName, restaurantHandle, broadcastMessage } =
        useMerchantActivity();
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
        <aside className="fixed top-0 right-0 z-30 hidden h-screen w-[380px] flex-col border-l border-[#F1F1F1] bg-white p-8 shadow-[-4px_0_24px_-12px_rgba(0,0,0,0.02)] xl:flex">
            {/* Profile Section */}
            <div className="group relative mb-10 rounded-[2.5rem] bg-[#F8F9FA] p-8 text-center transition-shadow hover:shadow-sm">
                {/* Avatar */}
                <div className="relative mb-4 inline-block">
                    <div className="mx-auto h-24 w-24 rounded-full bg-white p-1 shadow-sm ring-4 ring-white">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${restaurantName}`}
                            alt="Profile"
                            className="h-full w-full rounded-full bg-red-50 object-cover"
                        />
                    </div>
                    {loading ? (
                        <div className="absolute right-0 bottom-2 h-6 w-6 animate-pulse rounded-full border-4 border-[#F8F9FA] bg-gray-300" />
                    ) : (
                        <div className="absolute right-0 bottom-2 h-6 w-6 animate-pulse rounded-full border-4 border-[#F8F9FA] bg-green-500" />
                    )}
                </div>

                {/* Name & Handle */}
                {loading ? (
                    <div className="mb-8 flex flex-col items-center gap-2">
                        <Skeleton className="h-6 w-32" />
                        <Skeleton className="h-4 w-24" />
                    </div>
                ) : (
                    <>
                        <h2 className="mb-1 text-xl font-bold tracking-tight text-black">
                            {restaurantName}
                        </h2>
                        <p className="mb-8 text-sm font-medium text-gray-400">{restaurantHandle}</p>
                    </>
                )}

                {/* Buttons Row */}
                <div className="relative flex justify-center gap-4">
                    <button
                        onClick={handleNotificationClick}
                        className="group/btn flex h-12 w-12 items-center justify-center rounded-full border border-gray-100 bg-white text-gray-700 shadow-sm transition-all hover:-translate-y-1 hover:text-black hover:shadow-md active:scale-95"
                    >
                        <Bell className="group-hover/btn:swing h-5 w-5 transition-transform" />
                    </button>

                    <button
                        onClick={handleMessageClick}
                        className="group/btn flex h-12 w-12 items-center justify-center rounded-full border border-gray-100 bg-white text-gray-700 shadow-sm transition-all hover:-translate-y-1 hover:text-black hover:shadow-md active:scale-95"
                    >
                        <MessageSquare className="h-5 w-5 transition-transform group-hover/btn:scale-110" />
                    </button>

                    <button
                        onClick={handleMoreClick}
                        className="group/btn flex h-12 w-12 items-center justify-center rounded-full border border-gray-100 bg-white text-gray-700 shadow-sm transition-all hover:-translate-y-1 hover:text-black hover:shadow-md active:scale-95"
                    >
                        <MoreHorizontal className="h-5 w-5 transition-transform group-hover/btn:rotate-90" />
                    </button>
                </div>
            </div>

            {/* Activity Stream */}
            <div className="flex min-h-0 flex-1 flex-col">
                <div className="sticky top-0 z-10 mb-8 flex items-center justify-between bg-white py-2">
                    <h3 className="text-lg font-bold tracking-tight text-gray-800">
                        Recent Activity
                    </h3>
                    <div className="h-1 w-12 rounded-full bg-gray-100" />
                </div>

                <div className="no-scrollbar relative flex-1 space-y-8 overflow-y-auto pr-2 pb-4">
                    {/* Vertical Line */}
                    <div className="absolute top-4 bottom-4 left-[18px] w-[2px] bg-gray-100/50" />

                    {loading ? (
                        /* Skeleton Loader */
                        <div className="space-y-10 pt-2">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="relative pl-12">
                                    <Skeleton className="absolute top-1 left-0 h-3 w-3 rounded-full" />
                                    <div className="mb-3 flex items-center justify-between">
                                        <Skeleton className="h-4 w-24 rounded-md" />
                                        <Skeleton className="h-3 w-12 rounded-md" />
                                    </div>
                                    <Skeleton className="mb-3 h-4 w-full rounded-md" />
                                    <Skeleton className="h-16 w-full rounded-2xl" />
                                </div>
                            ))}
                        </div>
                    ) : activities.length === 0 ? (
                        <div className="py-10 pl-8 text-center">
                            <p className="text-sm font-medium text-gray-400">No recent activity.</p>
                        </div>
                    ) : (
                        activities.map(item => (
                            <div
                                key={item.id}
                                className="group animate-in slide-in-from-bottom-2 relative pl-12 duration-300"
                            >
                                {/* Dot Color based on activity type */}
                                <div
                                    className={`absolute top-1.5 left-0 z-10 h-3 w-3 rounded-full ring-4 ring-white ${
                                        item.type === 'order'
                                            ? 'bg-red-500 shadow-sm shadow-red-200'
                                            : item.type === 'kitchen'
                                              ? 'bg-green-500 shadow-sm shadow-green-200'
                                              : item.type === 'request'
                                                ? 'bg-orange-500 shadow-sm shadow-orange-200'
                                                : 'bg-blue-500 shadow-sm shadow-blue-200'
                                    } transition-all group-hover:scale-125`}
                                />

                                <div className="mb-2 flex items-start justify-between">
                                    <div className="flex items-center gap-2">
                                        <h4 className="text-sm font-bold text-gray-900 transition-colors group-hover:text-black">
                                            {item.user}
                                        </h4>
                                    </div>
                                    <span className="rounded-md bg-gray-50 px-2 py-1 text-[10px] font-bold tracking-wider text-gray-400 uppercase">
                                        {item.time}
                                    </span>
                                </div>

                                <p className="mb-4 text-sm leading-relaxed font-medium text-gray-500">
                                    {item.action}{' '}
                                    <span className="cursor-pointer font-bold text-blue-600 decoration-2 underline-offset-2 hover:underline">
                                        {item.target}
                                    </span>
                                </p>

                                {item.hasMessage && (
                                    <div className="relative mb-2 rounded-2xl rounded-tl-none bg-[#EEF2FF] p-4 text-sm leading-relaxed font-medium text-[#4F46E5] transition-shadow group-hover:shadow-md">
                                        "{item.message}"
                                        <div className="absolute -right-2 -bottom-2 rounded-full border-4 border-white bg-yellow-400 p-1.5 shadow-sm">
                                            <span
                                                role="img"
                                                aria-label="note"
                                                className="block text-xs"
                                            >
                                                📝
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {item.hasFile && (
                                    <div className="group/file flex cursor-pointer items-center gap-4 rounded-2xl border border-green-100 bg-green-50 p-4 transition-colors hover:bg-green-100">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black text-white shadow-md shadow-black/10 transition-transform group-hover/file:scale-110">
                                            <FileText className="h-5 w-5 text-green-400" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="line-clamp-1 text-sm font-bold text-gray-900">
                                                {item.fileName}
                                            </p>
                                            <p className="mt-0.5 text-[10px] font-bold text-gray-400 uppercase">
                                                {item.fileSize}
                                            </p>
                                        </div>
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full border border-green-200 bg-white text-green-500 shadow-sm">
                                            <CheckCircle2 className="h-4 w-4" />
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>

                {/* Input Area (Reverted Design with Pink Icon/No Border) */}
                <div className="relative mt-auto bg-white pt-6">
                    <div className="group relative">
                        <input
                            type="text"
                            placeholder="Type a quick broadcast to staff..."
                            value={broadcastInput}
                            onChange={e => setBroadcastInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="w-full rounded-2xl bg-[#F8F9FA] py-4 pr-12 pl-6 text-sm font-medium shadow-inner transition-all placeholder:text-gray-400 focus:ring-0 focus:outline-none"
                        />

                        <div className="absolute top-1/2 right-4 flex -translate-y-1/2 items-center gap-3 text-gray-400">
                            <button
                                onClick={handleBroadcast}
                                className="transition-transform hover:scale-110 hover:text-black active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                                disabled={!broadcastInput.trim()}
                            >
                                <span
                                    role="img"
                                    aria-label="emoji"
                                    className="text-2xl shadow-sm contrast-125 filter transition-all hover:brightness-110"
                                >
                                    📢
                                </span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </aside>
    );
}
