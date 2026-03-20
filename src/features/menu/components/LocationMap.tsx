'use client';

import React from 'react';

interface LocationMapProps {
    latitude: number;
    longitude: number;
    name: string;
}

/**
 * LocationMap Component
 *
 * Displays a static map with the restaurant location using OpenStreetMap embed.
 * This is a lightweight, free alternative to Google Maps that doesn't require additional dependencies.
 */
export function LocationMap({ latitude, longitude, name }: LocationMapProps) {
    // Create OpenStreetMap embed URL
    const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${longitude - 0.005}%2C${latitude - 0.003}%2C${longitude + 0.005}%2C${latitude + 0.003}&layer=mapnik&marker=${latitude}%2C${longitude}`;

    // Google Maps directions URL
    const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;

    return (
        <div className="relative">
            {/* Embedded OpenStreetMap */}
            <iframe
                title={`Map showing ${name}`}
                src={mapUrl}
                className="h-64 w-full rounded-xl border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
            />

            {/* Fallback link for users who prefer Google Maps */}
            <a
                href={directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute right-3 bottom-3 flex items-center gap-1 rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-md transition-colors hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                </svg>
                Open in Maps
            </a>
        </div>
    );
}

export default LocationMap;
