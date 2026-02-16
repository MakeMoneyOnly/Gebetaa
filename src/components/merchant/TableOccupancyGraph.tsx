'use client';

import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

export interface TableOccupancyGraphProps {
    className?: string;
    tables?: { id: string; table_number: string }[];
}

// Active restaurant hours: 7 AM to 12 AM (Midnight)
const START_HOUR = 7;
const END_HOUR = 24; // 24 represents 12 AM
const HOURS = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i);

// Occupancy level colors (Orange scale)
const OCCUPANCY_COLORS = [
    'bg-gray-100',    // Level 0 - Empty
    'bg-orange-200',  // Level 1
    'bg-orange-300',  // Level 2
    'bg-orange-400',  // Level 3
    'bg-orange-500',  // Level 4 - Max
];

const OCCUPANCY_LEVELS = [0, 1, 2, 3, 4];

const TIME_FILTERS = ['Today', 'Yesterday', 'Last 7 Days', 'Last 30 Days'];

export function TableOccupancyGraph({
    className = '',
    tables = [],
}: TableOccupancyGraphProps) {
    const [hoveredCell, setHoveredCell] = useState<{ table: string; hour: number; count: number } | null>(null);
    const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
    const [timeFilter, setTimeFilter] = useState('Today');
    const [filterOpen, setFilterOpen] = useState(false);

    // Generate mock data for occupancy visualization depending on filter
    const occupancyData = useMemo(() => {
        const data: Record<string, Record<number, number>> = {};

        // Seed randomness based on filter to show different data
        const seedMultiplier = timeFilter === 'Today' ? 1 : timeFilter === 'Yesterday' ? 2 : 3;

        tables.forEach((table) => {
            data[table.id] = {};
            HOURS.forEach(hour => {
                // Mock logic: Peak hours at Lunch (12-14) and Dinner (19-21)
                // Adjust intensity based on filter to simulate changing data
                let level = 0;
                const isLunch = hour >= 12 && hour <= 14;
                const isDinner = hour >= 19 && hour <= 21;
                // Some tables are popular in the morning (7-9)
                const isBreakfast = hour >= 7 && hour <= 9;

                const isPopular = table.table_number.includes('1') || table.table_number.includes('A');

                if (isLunch || isDinner) {
                    level = 2 + Math.floor((Math.random() * 3 + seedMultiplier) % 3);
                    if (isPopular) level = Math.min(4, level + 1);
                } else if (isBreakfast) {
                    level = 1 + Math.floor((Math.random() * 2 + seedMultiplier) % 2);
                } else {
                    level = Math.floor((Math.random() * 3 + seedMultiplier) % 3);
                    if (isPopular) level = Math.min(4, level + 1);
                }

                if (Math.random() > 0.7) level = Math.max(0, level - 1);
                level = Math.max(0, Math.min(4, level));

                data[table.id][hour] = level;
            });
        });
        return data;
    }, [tables, timeFilter]);


    const handleCellHover = (tableNumber: string, hour: number, count: number, event: React.MouseEvent) => {
        setHoveredCell({ table: tableNumber, hour, count });
        setTooltipPosition({ x: event.clientX, y: event.clientY });
    };

    const handleCellLeave = () => {
        setHoveredCell(null);
    };

    const formatHour = (hour: number) => {
        if (hour === 24) return '12AM';
        const h = hour > 12 ? hour - 12 : hour;
        const ampm = hour >= 12 ? 'PM' : 'AM';
        return `${h}${ampm}`;
    };

    const getOccupancyLabel = (level: number) => {
        switch (level) {
            case 0: return 'Empty';
            case 1: return 'Sparingly Used';
            case 2: return 'Moderately Busy';
            case 3: return 'Very Busy';
            case 4: return 'Fully Booked';
            default: return 'Unknown';
        }
    };

    if (!tables || tables.length === 0) {
        return (
            <div className={`bg-white p-6 rounded-[2rem] shadow-sm ${className} flex items-center justify-center min-h-[150px]`}>
                <p className="text-gray-400 font-medium">No table data available.</p>
            </div>
        );
    }

    return (
        <div className={`contribution-graph bg-white p-8 rounded-[2rem] shadow-sm mt-8 ${className}`}>
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                    <h3 className="text-xl font-bold text-gray-900 tracking-tight">Hourly Occupancy</h3>
                    <p className="text-gray-400 text-xs font-medium">Heatmap of table usage throughout the day</p>
                </div>

                <div className="flex items-center gap-4">
                    {/* Time Filter Dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setFilterOpen(!filterOpen)}
                            className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 px-4 py-2 rounded-xl text-xs font-bold text-gray-700 transition-colors"
                        >
                            {timeFilter}
                            <ChevronDown className={`h-3 w-3 transition-transform ${filterOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {filterOpen && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setFilterOpen(false)} />
                                <div className="absolute right-0 top-full mt-2 w-40 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-20 animate-in fade-in zoom-in-95 duration-200">
                                    {TIME_FILTERS.map((filter) => (
                                        <button
                                            key={filter}
                                            onClick={() => {
                                                setTimeFilter(filter);
                                                setFilterOpen(false);
                                            }}
                                            className={`w-full text-left px-4 py-3 text-xs font-bold hover:bg-gray-50 transition-colors ${timeFilter === filter ? 'text-orange-600 bg-orange-50' : 'text-gray-600'
                                                }`}
                                        >
                                            {filter}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Legend */}
                    <div className="hidden lg:flex items-center text-[10px] gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                        <span className="text-gray-400 font-medium">Less</span>
                        <div className="flex items-center gap-1">
                            {OCCUPANCY_LEVELS.map((level) => (
                                <div
                                    key={level}
                                    className={`h-2.5 w-2.5 rounded-full ${OCCUPANCY_COLORS[level]}`}
                                />
                            ))}
                        </div>
                        <span className="text-gray-400 font-medium">More</span>
                    </div>
                </div>
            </div>

            <div className="w-full overflow-x-auto pb-4">
                <table className="border-separate border-spacing-x-1 border-spacing-y-1 w-full text-xs min-w-[800px]">
                    {/* Header: Hours */}
                    <thead>
                        <tr>
                            <td className="w-16 sticky left-0 bg-white z-10"></td>
                            {HOURS.map((hour) => (
                                <td key={hour} className="text-gray-400 font-bold text-[10px] text-center pb-2 min-w-[32px]">
                                    {formatHour(hour)}
                                </td>
                            ))}
                        </tr>
                    </thead>

                    {/* Body: Tables */}
                    <tbody>
                        {tables.map((table) => (
                            <tr key={table.id}>
                                {/* Row Label - Sticky */}
                                <td className="text-gray-500 font-bold text-[11px] text-right pr-4 whitespace-nowrap sticky left-0 bg-white z-10">
                                    {table.table_number}
                                </td>

                                {/* Cells */}
                                {HOURS.map((hour) => {
                                    const level = occupancyData[table.id]?.[hour] ?? 0;
                                    return (
                                        <td
                                            key={hour}
                                            className="h-10 w-10 p-0.5 relative group" // Reduced padding for tighter heatmap
                                            onMouseEnter={(e) => handleCellHover(table.table_number, hour, level, e)}
                                            onMouseLeave={handleCellLeave}
                                        >
                                            <div
                                                className={`h-full w-full rounded-md transition-all duration-300 ${OCCUPANCY_COLORS[level]
                                                    } hover:scale-105 hover:shadow-sm`}
                                            />
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Tooltip */}
            <AnimatePresence>
                {hoveredCell && (
                    <motion.div
                        initial={{ opacity: 0, y: 5, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 5, scale: 0.9 }}
                        transition={{ duration: 0.15 }}
                        className="fixed z-50 rounded-xl bg-gray-900 px-3 py-2 shadow-xl ring-1 ring-white/10 pointer-events-none"
                        style={{
                            left: tooltipPosition.x - 30, // Centered roughly
                            top: tooltipPosition.y - 60,
                        }}
                    >
                        <div className="flex flex-col gap-0.5 items-center text-center">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                {formatHour(hoveredCell.hour)}
                            </span>
                            <div className="text-xs font-bold text-white whitespace-nowrap">
                                Table {hoveredCell.table}
                            </div>
                            <div className="text-[10px] text-orange-400 font-bold mt-0.5">
                                {getOccupancyLabel(hoveredCell.count)}
                            </div>
                        </div>
                        {/* Arrow */}
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45" />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default TableOccupancyGraph;
