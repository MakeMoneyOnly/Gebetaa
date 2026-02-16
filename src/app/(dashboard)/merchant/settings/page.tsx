'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { Loader2, Shield, User, Store, Bell, Lock, ChevronRight, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/Skeleton';
import { useRole } from '@/hooks/useRole';

export default function SettingsPage() {
    const { user } = useRole(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [restaurantName, setRestaurantName] = useState('');
    const [activeTab, setActiveTab] = useState('profile');

    useEffect(() => {
        setLoading(true);
        // Mock fetch restaurant details
        // In a real app, fetch from Supabase
        if (user) {
            setTimeout(() => {
                setRestaurantName("Saba Grill");
                setLoading(false);
            }, 1000);
        } else {
            setLoading(false);
        }
    }, [user]);

    const handleSave = async () => {
        setSaving(true);
        // Simulate save
        setTimeout(() => setSaving(false), 1000);
    };

    const tabs = [
        { id: 'profile', label: 'Restaurant Profile', icon: Store },
        { id: 'account', label: 'Account', icon: User },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'security', label: 'Security', icon: Lock },
    ];

    if (loading) {
        return (
            <div className="space-y-10 pb-20 min-h-screen bg-white">
                <div className="flex items-center justify-between">
                    <div>
                        <Skeleton className="h-10 w-32 rounded-xl mb-2" />
                        <Skeleton className="h-4 w-48 rounded-lg" />
                    </div>
                </div>
                <div className="flex flex-col lg:flex-row gap-10">
                    <div className="w-full lg:w-64 flex-shrink-0 space-y-2">
                        {[1, 2, 3, 4].map((i) => (
                            <Skeleton key={i} className="h-12 w-full rounded-2xl" />
                        ))}
                    </div>
                    <div className="flex-1 rounded-[2.5rem] border border-gray-100 p-8 h-[500px]">
                        <div className="space-y-8">
                            <div>
                                <Skeleton className="h-8 w-48 rounded-lg mb-2" />
                                <Skeleton className="h-4 w-64 rounded-lg" />
                            </div>
                            <div className="flex items-center gap-6">
                                <Skeleton className="h-24 w-24 rounded-[2rem]" />
                                <div className="space-y-2">
                                    <Skeleton className="h-10 w-32 rounded-xl" />
                                    <Skeleton className="h-4 w-40 rounded-lg" />
                                </div>
                            </div>
                            <div className="space-y-4 max-w-2xl">
                                <Skeleton className="h-20 w-full rounded-2xl" />
                                <div className="grid grid-cols-2 gap-4">
                                    <Skeleton className="h-16 w-full rounded-2xl" />
                                    <Skeleton className="h-16 w-full rounded-2xl" />
                                </div>
                                <Skeleton className="h-32 w-full rounded-2xl" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-10 pb-20 min-h-screen bg-white">
            {/* Header */}
            <div>
                <h1 className="text-4xl font-bold text-black mb-2 tracking-tight">Settings</h1>
                <p className="text-gray-500 font-medium">Manage your restaurant preferences and account.</p>
            </div>

            <div className="flex flex-col lg:flex-row gap-10">
                {/* Sidebar Navigation */}
                <div className="w-full lg:w-64 flex-shrink-0 space-y-2">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-200 font-bold text-sm ${activeTab === tab.id
                                ? 'bg-black text-white shadow-lg shadow-black/10'
                                : 'text-gray-500 hover:bg-gray-50 hover:text-black'
                                }`}
                        >
                            <tab.icon className="h-4 w-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <div className="flex-1 bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-sm min-h-[500px]">
                    {activeTab === 'profile' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 tracking-tight mb-1">Restaurant Profile</h2>
                                <p className="text-gray-500 font-medium text-sm">Update your public restaurant information.</p>
                            </div>

                            <div className="space-y-6 max-w-2xl">
                                {/* Logo Upload */}
                                <div className="flex items-center gap-6">
                                    <div className="h-24 w-24 rounded-[2rem] bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden">
                                        <Store className="h-8 w-8 text-gray-300" />
                                    </div>
                                    <div>
                                        <button className="px-5 py-2 bg-white border border-gray-200 text-gray-900 rounded-xl font-bold text-sm hover:bg-gray-50 transition-colors">
                                            Change Logo
                                        </button>
                                        <p className="text-xs text-gray-400 mt-2 font-medium">
                                            Recommended size: 512x512px. <br /> JPG, PNG or GIF.
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-900 uppercase tracking-wider ml-1">Restaurant Name</label>
                                        <input
                                            type="text"
                                            value={restaurantName}
                                            onChange={(e) => setRestaurantName(e.target.value)}
                                            className="w-full px-5 py-4 rounded-2xl border-2 border-gray-100 bg-gray-50/50 text-gray-900 font-bold focus:border-black focus:outline-none focus:bg-white transition-all"
                                            placeholder="e.g. Saba Grill"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-gray-900 uppercase tracking-wider ml-1">Cuisine Type</label>
                                            <select className="w-full px-5 py-4 rounded-2xl border-2 border-gray-100 bg-gray-50/50 text-gray-900 font-bold focus:border-black focus:outline-none focus:bg-white transition-all appearance-none cursor-pointer">
                                                <option>Ethiopian</option>
                                                <option>Italian</option>
                                                <option>Burgers</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-gray-900 uppercase tracking-wider ml-1">Price Range</label>
                                            <select className="w-full px-5 py-4 rounded-2xl border-2 border-gray-100 bg-gray-50/50 text-gray-900 font-bold focus:border-black focus:outline-none focus:bg-white transition-all appearance-none cursor-pointer">
                                                <option>$$$</option>
                                                <option>$$</option>
                                                <option>$</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-900 uppercase tracking-wider ml-1">Description</label>
                                        <textarea
                                            className="w-full px-5 py-4 rounded-2xl border-2 border-gray-100 bg-gray-50/50 text-gray-900 font-medium focus:border-black focus:outline-none focus:bg-white transition-all min-h-[120px] resize-none"
                                            placeholder="Tell customers about your restaurant..."
                                        />
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-gray-50 flex justify-end">
                                    <button
                                        onClick={handleSave}
                                        disabled={saving}
                                        className="h-12 px-8 bg-black text-white rounded-xl font-bold shadow-lg shadow-black/10 hover:bg-gray-800 transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                                    >
                                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                        Save Changes
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'account' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 tracking-tight mb-1">Account & Billing</h2>
                                <p className="text-gray-500 font-medium text-sm">Manage your subscription and billing details.</p>
                            </div>

                            <div className="p-6 bg-gray-900 rounded-[2rem] text-white relative overflow-hidden">
                                <div className="relative z-10 flex justify-between items-start">
                                    <div>
                                        <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-lg text-xs font-bold uppercase tracking-wider mb-4">
                                            Pro Plan
                                        </span>
                                        <h3 className="text-3xl font-bold tracking-tight mb-1">2,500 ETB</h3>
                                        <p className="text-gray-400 font-medium text-sm">per month</p>
                                    </div>
                                    <div className="h-12 w-12 rounded-full bg-white/10 flex items-center justify-center">
                                        <Shield className="h-6 w-6" />
                                    </div>
                                </div>
                                <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between">
                                    <div className="text-sm font-medium text-gray-400">
                                        Next billing date: <span className="text-white font-bold">March 15, 2026</span>
                                    </div>
                                    <button className="text-sm font-bold hover:text-gray-300 transition-colors">
                                        Manage Subscription
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Placeholders for other tabs */}
                    {(activeTab === 'notifications' || activeTab === 'security') && (
                        <div className="h-full flex flex-col items-center justify-center text-center py-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="h-16 w-16 rounded-full bg-gray-50 flex items-center justify-center mb-4">
                                <Lock className="h-6 w-6 text-gray-300" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">Coming Soon</h3>
                            <p className="text-gray-500 font-medium mt-1">This section is under development.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
