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
                className="bg-brand-crimson fixed bottom-6 left-6 z-40 flex h-16 w-16 touch-manipulation items-center justify-center rounded-full text-white shadow-2xl transition-transform active:scale-90"
            >
                <Bell size={24} fill="currentColor" />
            </button>

            <Drawer.Root open={open} onOpenChange={setOpen}>
                <Drawer.Portal>
                    <Drawer.Overlay className="fixed inset-0 z-[9999] bg-black/40" />
                    <Drawer.Content className="pb-safe fixed right-0 bottom-0 left-0 z-[9999] mt-24 flex flex-col rounded-t-[32px] bg-white p-6 outline-none">
                        <div className="mx-auto mb-8 h-1.5 w-12 flex-shrink-0 rounded-full bg-gray-300" />

                        <Drawer.Title className="font-manrope mb-6 text-center text-2xl font-black">
                            Service Request
                        </Drawer.Title>

                        <div className="mb-4 flex flex-col gap-4">
                            <button
                                onClick={() => {
                                    trigger('success');
                                    alert('Waiter has been notified!');
                                    setOpen(false);
                                }}
                                className="bg-surface-1 flex h-16 w-full items-center justify-center gap-3 rounded-2xl text-lg font-bold transition-transform hover:bg-gray-100 active:scale-95"
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
                                className="bg-surface-1 flex h-16 w-full items-center justify-center gap-3 rounded-2xl text-lg font-bold transition-transform hover:bg-gray-100 active:scale-95"
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
