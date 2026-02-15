'use client';

import React from 'react';
import { Heart, Plus } from 'lucide-react';
import Image from 'next/image';

import { useHaptic } from '@/hooks/useHaptic';
import { cn, isRemoteOrDataImageSrc } from '@/lib/utils';

interface MenuItemProps {
    id: string;
    title: string;
    description?: string;
    price: number;
    imageUrl: string;
    rating?: number;
    shopName?: string;
}

// Update MenuCard component
export function MenuCard({
    item,
    onClick,
    onAdd,
    className,
}: {
    item: MenuItemProps;
    onClick?: () => void;
    onAdd?: () => void;
    className?: string;
}) {
    const { trigger } = useHaptic();
    const [imgSrc, setImgSrc] = React.useState(item.imageUrl);
    const [isLiked, setIsLiked] = React.useState(false);
    const isRemoteOrDataImage = imgSrc ? isRemoteOrDataImageSrc(imgSrc) : false;

    // Sync imgSrc with item.imageUrl when it changes
    React.useEffect(() => {
        setImgSrc(item.imageUrl);
    }, [item.imageUrl]);

    const handleLike = (e: React.MouseEvent) => {
        e.stopPropagation();
        trigger('medium');
        setIsLiked(!isLiked);
    };

    const handleAdd = (e: React.MouseEvent) => {
        e.stopPropagation();
        trigger('success');
        onAdd?.();
    };

    return (
        <div
            className={cn(
                "group tap-highlight-transparent relative touch-manipulation transition-transform duration-300 active:scale-[0.98]",
                className || "mb-6"
            )}
            onClick={() => {
                trigger('soft');
                onClick?.();
            }}
        >
            {/* Image Container */}
            <div className="relative h-[220px] overflow-hidden rounded-[32px] bg-gray-200 shadow-md">
                {/* Flash Photo Effect Overlay */}
                {/* Flash Photo Effect Overlay */}
                <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-black/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100"></div>

                <Image
                    src={imgSrc}
                    alt={item.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover"
                    // Avoid Next.js optimizer timeouts for external image hosts during development.
                    unoptimized={isRemoteOrDataImage}
                    onError={() => setImgSrc('https://axuegixbqsvztdraenkz.supabase.co/storage/v1/object/public/food-images/Spicy%20Tonkotsu.webp')}
                />

                {/* Top Floating Elements */}
                <button
                    onClick={handleLike}
                    className={cn(
                        'absolute top-3 left-3 z-[20] flex h-9 w-9 touch-manipulation items-center justify-center rounded-full border border-white/30 transition-all shadow-sm active:scale-90',
                        'bg-white/30 backdrop-blur-xl hover:bg-white/50',
                        isLiked && 'text-brand-crimson scale-110 shadow-md'
                    )}
                    style={{ transform: 'translateZ(0)' }}
                >
                    <Heart
                        size={18}
                        stroke="#a81818"
                        fill={isLiked ? '#a81818' : 'transparent'}
                        strokeWidth={isLiked ? 0 : 2.5}
                        className="transition-transform duration-300"
                    />
                </button>
                <div className="absolute -top-2 -right-2 z-[50] h-[90px] w-[90px]">
                    <Image
                        src="/Price.svg"
                        alt=""
                        width={90}
                        height={90}
                        className="h-full w-full"
                    />
                    <div className="absolute inset-0 flex flex-col items-center justify-center leading-tight text-white">
                        <span className="text-base font-black">
                            {Math.round(item.price).toLocaleString()}
                        </span>
                        <span className="text-xs font-bold">ETB</span>
                    </div>
                </div>

                {/* Add Button (Bottom Right of Image) */}
                <button
                    onClick={handleAdd}
                    className="bg-brand-crimson absolute right-3 bottom-3 z-[50] flex h-10 w-10 touch-manipulation items-center justify-center rounded-full text-white shadow-lg transition-transform group-hover:scale-110 active:scale-90"
                >
                    <Plus size={20} />
                </button>
            </div>

            {/* Info Below */}
            <div className="mt-3 px-1">
                <h3 className="text-lg leading-tight font-bold text-black/90 dark:text-white/90">{item.title}</h3>
                <div className="mt-1 flex items-center justify-between">
                    <p className="text-xs font-bold tracking-tight text-black/40 dark:text-white/40 uppercase">
                        {item.shopName}
                    </p>
                    <div className="mr-1 flex items-center gap-0.5">
                        <span className="text-brand-crimson text-xs font-bold">★</span>
                        <span className="text-xs font-bold text-black/90 dark:text-white/90">{item.rating || 4.5}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
