'use client';

import React from 'react';
import { useMerchantActivity } from '@/hooks/useMerchantActivity';
import { toast } from 'react-hot-toast';
import { ProfileSection } from './RightPanelProfile';
import { LoleChatbot } from './LoleChatbot';

export function RightPanel() {
    const { loading, restaurantName, restaurantHandle } = useMerchantActivity();

    const handleNotificationClick = () => {
        toast('No new notifications', { icon: '🔔' });
    };

    const handleMessageClick = () => {
        toast('No new messages', { icon: '💬' });
    };

    const handleMoreClick = () => {
        toast('Settings menu', { icon: '⚙️' });
    };

    return (
        <aside className="fixed top-0 right-0 z-30 hidden h-screen w-[380px] flex-col border-l border-[#F1F1F1] bg-white p-8 shadow-[-4px_0_24px_-12px_rgba(0,0,0,0.02)] xl:flex">
            {/* Profile / Restaurant card — unchanged */}
            <ProfileSection
                restaurantName={restaurantName}
                restaurantHandle={restaurantHandle}
                loading={loading}
                onNotificationClick={handleNotificationClick}
                onMessageClick={handleMessageClick}
                onMoreClick={handleMoreClick}
            />

            {/* lole AI Agent chatbot */}
            <LoleChatbot />
        </aside>
    );
}
