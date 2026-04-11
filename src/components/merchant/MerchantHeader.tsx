'use client';

import React from 'react';
import { 
  Bell, 
  Plus, 
  Download 
} from 'lucide-react';
import Image from 'next/image';
import { LocationSwitcher } from '@/components/merchant/LocationSwitcher';

export function MerchantHeader() {
  return (
    <header className="sticky top-0 z-40 flex h-[88px] w-full items-center justify-between border-b border-[#F1F1F1] bg-white px-6 lg:px-10">
      {/* 1. Location Switcher (Replaced Search) */}
      <LocationSwitcher />

      {/* 2. Right Side: Avatars, Notifications, Export */}
      <div className="flex items-center gap-6">
        {/* Avatars + Add Button */}
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2.5">
            {[47, 12, 68].map((img) => (
              <div key={img} className="h-9 w-9 overflow-hidden rounded-full border-2 border-white shadow-sm transition-transform hover:scale-105 active:scale-95 cursor-pointer">
                <Image 
                  src={`https://i.pravatar.cc/100?img=${img}`} 
                  alt="Staff" 
                  width={36} 
                  height={36} 
                  className="h-full w-full object-cover"
                />
              </div>
            ))}
            <button className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-gray-50 text-gray-400 shadow-sm transition-all hover:bg-gray-100 hover:text-black active:scale-95">
              <Plus className="h-4 w-4" strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-4 border-l border-gray-100 pl-6">
          <button className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-gray-100 bg-white text-gray-500 shadow-sm transition-all hover:bg-gray-50 hover:text-black hover:shadow-md active:scale-95">
            <Bell className="h-5 w-5" strokeWidth={1.5} />
            <span className="absolute top-3 right-3 h-2 w-2 rounded-full border-2 border-white bg-brand-accent"></span>
          </button>
          <button className="flex items-center gap-2 h-11 rounded-xl bg-brand-accent px-6 text-sm font-bold text-black shadow-lg shadow-brand-accent/10 transition-all hover:brightness-105 hover:shadow-xl active:scale-95">
            Export
            <Download className="h-4 w-4" strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </header>
  );
}
