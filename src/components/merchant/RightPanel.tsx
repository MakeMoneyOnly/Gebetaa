'use client';

import React, { useState } from 'react';
import { useMerchantActivity } from '@/hooks/useMerchantActivity';
import { toast } from 'react-hot-toast';
import { ProfileSection } from './RightPanelProfile';
import { ActivityStream } from './RightPanelActivityStream';
import { BroadcastInput } from './RightPanelBroadcastInput';

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
            <ProfileSection
                restaurantName={restaurantName}
                restaurantHandle={restaurantHandle}
                loading={loading}
                onNotificationClick={handleNotificationClick}
                onMessageClick={handleMessageClick}
                onMoreClick={handleMoreClick}
            />

            {/* Activity Stream */}
            <div className="flex min-h-0 flex-1 flex-col">
                <div className="sticky top-0 z-10 mb-8 flex items-center justify-between bg-white py-2">
                    <h3 className="text-lg font-bold tracking-tight text-gray-800">
                        Recent Activity
                    </h3>
                    <div className="h-1 w-12 rounded-full bg-gray-100" />
                </div>

                <ActivityStream activities={activities} loading={loading} />
            </div>

            {/* Broadcast Input */}
            <BroadcastInput
                value={broadcastInput}
                onChange={setBroadcastInput}
                onBroadcast={handleBroadcast}
                onKeyDown={handleKeyDown}
            />
        </aside>
    );
}
