'use client';

import { Bell, HandPlatter, Receipt } from 'lucide-react';
import { useHaptic } from '@/hooks/useHaptic';
import { Drawer } from 'vaul';
import { useState } from 'react';

export function ServiceRequestButton() {
    const { trigger } = useHaptic();
    const [open, setOpen] = useState(false);

    return (
        <>
            <button
                onClick={() => {
                    trigger('medium');
                    setOpen(true);
                }}
                className="fixed bottom-6 left-6 w-16 h-16 rounded-full bg-brand-crimson text-white shadow-2xl z-40 flex items-center justify-center active:scale-90 transition-transform touch-manipulation"
            >
                <Bell size={24} fill="currentColor" />
            </button>

            <Drawer.Root open={open} onOpenChange={setOpen}>
                <Drawer.Portal>
                    <Drawer.Overlay className="fixed inset-0 bg-black/40 z-[9999]" />
                    <Drawer.Content className="bg-white flex flex-col rounded-t-[32px] mt-24 fixed bottom-0 left-0 right-0 z-[9999] p-6 pb-safe outline-none">
                        <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-gray-300 mb-8" />

                        <Drawer.Title className="text-2xl font-black font-manrope mb-6 text-center">Service Request</Drawer.Title>

                        <div className="flex flex-col gap-4 mb-4">
                            <button
                                onClick={() => {
                                    trigger('success');
                                    alert('Waiter has been notified!');
                                    setOpen(false);
                                }}
                                className="w-full h-16 bg-surface-1 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 active:scale-95 transition-transform hover:bg-gray-100"
                            >
                                <HandPlatter size={24} className="text-brand-crimson" />
                                Call for a Waiter
                            </button>

                            <button
                                onClick={() => {
                                    trigger('success');
                                    alert('Bill requested!');
                                    setOpen(false);
                                }}
                                className="w-full h-16 bg-surface-1 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 active:scale-95 transition-transform hover:bg-gray-100"
                            >
                                <Receipt size={24} className="text-brand-crimson" />
                                Ask for a Bill
                            </button>
                        </div>
                    </Drawer.Content>
                </Drawer.Portal>
            </Drawer.Root>
        </>
    );
}
