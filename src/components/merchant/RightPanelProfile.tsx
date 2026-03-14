'use client';

import { Bell, MessageSquare, MoreHorizontal } from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';

interface ProfileSectionProps {
    restaurantName: string | undefined;
    restaurantHandle: string | undefined;
    loading: boolean;
    onNotificationClick: () => void;
    onMessageClick: () => void;
    onMoreClick: () => void;
}

export function ProfileSection({
    restaurantName,
    restaurantHandle,
    loading,
    onNotificationClick,
    onMessageClick,
    onMoreClick,
}: ProfileSectionProps) {
    return (
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
                    onClick={onNotificationClick}
                    className="group/btn flex h-12 w-12 items-center justify-center rounded-full border border-gray-100 bg-white text-gray-700 shadow-sm transition-all hover:-translate-y-1 hover:text-black hover:shadow-md active:scale-95"
                >
                    <Bell className="group-hover/btn:swing h-5 w-5 transition-transform" />
                </button>

                <button
                    onClick={onMessageClick}
                    className="group/btn flex h-12 w-12 items-center justify-center rounded-full border border-gray-100 bg-white text-gray-700 shadow-sm transition-all hover:-translate-y-1 hover:text-black hover:shadow-md active:scale-95"
                >
                    <MessageSquare className="h-5 w-5 transition-transform group-hover/btn:scale-110" />
                </button>

                <button
                    onClick={onMoreClick}
                    className="group/btn flex h-12 w-12 items-center justify-center rounded-full border border-gray-100 bg-white text-gray-700 shadow-sm transition-all hover:-translate-y-1 hover:text-black hover:shadow-md active:scale-95"
                >
                    <MoreHorizontal className="h-5 w-5 transition-transform group-hover/btn:rotate-90" />
                </button>
            </div>
        </div>
    );
}
