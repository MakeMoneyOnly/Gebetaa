"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface CanvasRevealEffectProps {
    animationSpeed?: number;
    opacities?: number[];
    colors?: number[][];
    containerClassName?: string;
    dotSize?: number;
    showGradient?: boolean;
    reverse?: boolean;
}

export const CanvasRevealEffect = ({
    containerClassName,
    showGradient = true,
}: CanvasRevealEffectProps) => {
    return (
        <div className={cn("h-full relative w-full", containerClassName)}>
            {/* Simplified animated background using CSS */}
            <div className="absolute inset-0 opacity-30">
                <div className="absolute inset-0 bg-gradient-to-br from-brand-crimson/20 via-transparent to-brand-crimson/10 animate-pulse" />
                <div
                    className="absolute inset-0"
                    style={{
                        backgroundImage: `radial-gradient(circle, rgba(168, 24, 24, 0.3) 1px, transparent 1px)`,
                        backgroundSize: '20px 20px',
                        animation: 'shimmer 3s ease-in-out infinite'
                    }}
                />
            </div>
            {showGradient && (
                <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />
            )}
            <style jsx>{`
        @keyframes shimmer {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.6; }
        }
      `}</style>
        </div>
    );
};
