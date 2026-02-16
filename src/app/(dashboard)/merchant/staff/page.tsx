'use client';

import React, { useState } from 'react';
import {
    Users,
    UserCheck,
    Star,
    Plus,
    MoreHorizontal,
    Phone,
    Mail,
    Clock,
    Shield,
    CheckCircle
} from 'lucide-react';
import { cn } from '@/lib/utils'; // Assuming this exists, based on other files

// Mock Data
const mockStaff = [
    {
        id: 1,
        name: "Sarah Johnson",
        role: "Manager",
        status: "on_shift",
        email: "sarah@gebeta.app",
        phone: "+251 911 234 567",
        rating: 4.9,
        tables_served: 1240,
        avatar_color: "bg-blue-100 text-blue-600"
    },
    {
        id: 2,
        name: "David Chen",
        role: "Head Chef",
        status: "on_shift",
        email: "david@gebeta.app",
        phone: "+251 922 345 678",
        rating: 4.8,
        tables_served: 0,
        avatar_color: "bg-orange-100 text-orange-600"
    },
    {
        id: 3,
        name: "Michael Smith",
        role: "Server",
        status: "off_shift",
        email: "michael@gebeta.app",
        phone: "+251 933 456 789",
        rating: 4.7,
        tables_served: 856,
        avatar_color: "bg-purple-100 text-purple-600"
    },
    {
        id: 4,
        name: "Jessica Brown",
        role: "Server",
        status: "on_shift",
        email: "jessica@gebeta.app",
        phone: "+251 944 567 890",
        rating: 4.9,
        tables_served: 432,
        avatar_color: "bg-pink-100 text-pink-600"
    },
    {
        id: 5,
        name: "Alex Wilson",
        role: "Bartender",
        status: "break",
        email: "alex@gebeta.app",
        phone: "+251 955 678 901",
        rating: 4.6,
        tables_served: 210,
        avatar_color: "bg-green-100 text-green-600"
    }
];

export default function StaffPage() {
    const totalStaff = mockStaff.length;
    const onShift = mockStaff.filter(s => s.status === 'on_shift').length;
    const avgRating = 4.8;

    return (
        <div className="space-y-8 pb-20 min-h-screen">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-4xl font-bold text-black mb-2 tracking-tight">Staff Management</h1>
                    <p className="text-gray-500 font-medium">Manage your team and permissions.</p>
                </div>
                <button className="h-12 px-5 bg-black text-white rounded-xl flex items-center gap-2 hover:bg-gray-800 transition-colors shadow-lg shadow-black/10 font-bold text-sm">
                    <Plus className="h-4 w-4" />
                    Add Member
                </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
                {/* Total Staff */}
                <div className="bg-white p-5 rounded-[2rem] flex flex-col justify-between h-[180px] relative overflow-hidden shadow-sm hover:shadow-md transition-all group">
                    <div className="flex justify-between items-start mb-2">
                        <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center text-gray-900 shadow-sm">
                            <Users className="h-4 w-4" />
                        </div>
                        <div className="flex flex-col items-end gap-1">
                            <span className="bg-gray-100 text-gray-600 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">
                                Total
                            </span>
                            <h3 className="text-4xl font-bold text-gray-900 tracking-tight mt-[20px]">{totalStaff}</h3>
                        </div>
                    </div>
                    <div className="absolute bottom-5 left-5 right-5">
                        <div className="mb-3">
                            <h3 className="text-gray-900 font-bold text-lg leading-none mb-1">Total Staff</h3>
                            <p className="text-gray-400 text-xs font-medium">Active Employees</p>
                        </div>
                        <div className="flex justify-between text-[10px] font-medium text-gray-400 mb-2">
                            <span>Target: 10</span>
                            <span>Current: {totalStaff}</span>
                        </div>
                        <div className="flex justify-between items-center gap-1">
                            {Array.from({ length: 20 }).map((_, i) => {
                                const activeCount = 10;
                                const isActive = i < activeCount;
                                const opacity = isActive ? 0.3 + (0.7 * (i / activeCount)) : 1;
                                return <div key={i} style={{ opacity: isActive ? opacity : 1 }} className={`h-[15px] w-[15px] rounded-full ${isActive ? 'bg-gray-800' : 'bg-gray-100'}`} />
                            })}
                        </div>
                    </div>
                </div>

                {/* On Shift */}
                <div className="bg-white p-5 rounded-[2rem] flex flex-col justify-between h-[180px] relative overflow-hidden shadow-sm hover:shadow-md transition-all group">
                    <div className="flex justify-between items-start mb-2">
                        <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center text-green-600 shadow-sm">
                            <UserCheck className="h-4 w-4" />
                        </div>
                        <div className="flex flex-col items-end gap-1">
                            <span className="bg-green-50 text-green-600 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">
                                Active Now
                            </span>
                            <h3 className="text-4xl font-bold text-gray-900 tracking-tight mt-[20px]">{onShift}</h3>
                        </div>
                    </div>
                    <div className="absolute bottom-5 left-5 right-5">
                        <div className="mb-3">
                            <h3 className="text-gray-900 font-bold text-lg leading-none mb-1">On Shift</h3>
                            <p className="text-gray-400 text-xs font-medium">Currently Working</p>
                        </div>
                        <div className="flex justify-between text-[10px] font-medium text-gray-400 mb-2">
                            <span>Clocked in: {onShift}</span>
                            <span>Total: {totalStaff}</span>
                        </div>
                        <div className="flex justify-between items-center gap-1">
                            {Array.from({ length: 20 }).map((_, i) => {
                                const activeCount = Math.round((onShift / totalStaff) * 20);
                                const isActive = i < activeCount;
                                const opacity = isActive ? 0.3 + (0.7 * (i / activeCount)) : 1;
                                return <div key={i} style={{ opacity: isActive ? opacity : 1 }} className={`h-[15px] w-[15px] rounded-full ${isActive ? 'bg-green-500' : 'bg-gray-100'}`} />
                            })}
                        </div>
                    </div>
                </div>

                {/* Avg Rating */}
                <div className="bg-white p-5 rounded-[2rem] flex flex-col justify-between h-[180px] relative overflow-hidden shadow-sm hover:shadow-md transition-all group">
                    <div className="flex justify-between items-start mb-2">
                        <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center text-yellow-600 shadow-sm">
                            <Star className="h-4 w-4" />
                        </div>
                        <div className="flex flex-col items-end gap-1">
                            <span className="bg-yellow-50 text-yellow-600 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">
                                Top Tier
                            </span>
                            <h3 className="text-4xl font-bold text-gray-900 tracking-tight mt-[20px]">{avgRating}</h3>
                        </div>
                    </div>
                    <div className="absolute bottom-5 left-5 right-5">
                        <div className="mb-3">
                            <h3 className="text-gray-900 font-bold text-lg leading-none mb-1">Performance</h3>
                            <p className="text-gray-400 text-xs font-medium">Average Staff Rating</p>
                        </div>
                        <div className="flex justify-between text-[10px] font-medium text-gray-400 mb-2">
                            <span>Avg: {avgRating}</span>
                            <span>Target: 5.0</span>
                        </div>
                        <div className="flex justify-between items-center gap-1">
                            {Array.from({ length: 20 }).map((_, i) => {
                                const activeCount = 18;
                                const isActive = i < activeCount;
                                const opacity = isActive ? 0.3 + (0.7 * (i / activeCount)) : 1;
                                return <div key={i} style={{ opacity: isActive ? opacity : 1 }} className={`h-[15px] w-[15px] rounded-full ${isActive ? 'bg-yellow-500' : 'bg-gray-100'}`} />
                            })}
                        </div>
                    </div>
                </div>

                {/* Attendance - New Card */}
                <div className="bg-white p-5 rounded-[2rem] flex flex-col justify-between h-[180px] relative overflow-hidden shadow-sm hover:shadow-md transition-all group">
                    <div className="flex justify-between items-start mb-2">
                        <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center text-blue-600 shadow-sm">
                            <CheckCircle className="h-4 w-4" />
                        </div>
                        <div className="flex flex-col items-end gap-1">
                            <span className="bg-blue-50 text-blue-600 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">
                                Excellent
                            </span>
                            <h3 className="text-4xl font-bold text-gray-900 tracking-tight mt-[20px]">98%</h3>
                        </div>
                    </div>
                    <div className="absolute bottom-5 left-5 right-5">
                        <div className="mb-3">
                            <h3 className="text-gray-900 font-bold text-lg leading-none mb-1">Attendance</h3>
                            <p className="text-gray-400 text-xs font-medium">On-Time Performance</p>
                        </div>
                        <div className="flex justify-between text-[10px] font-medium text-gray-400 mb-2">
                            <span>Today: 98%</span>
                            <span>Target: 95%</span>
                        </div>
                        <div className="flex justify-between items-center gap-1">
                            {Array.from({ length: 20 }).map((_, i) => {
                                const activeCount = 19;
                                const isActive = i < activeCount;
                                const opacity = isActive ? 0.3 + (0.7 * (i / activeCount)) : 1;
                                return <div key={i} style={{ opacity: isActive ? opacity : 1 }} className={`h-[15px] w-[15px] rounded-full ${isActive ? 'bg-blue-500' : 'bg-gray-100'}`} />
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Staff List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {mockStaff.map((staff) => (
                    <div key={staff.id} className="bg-white p-6 rounded-[2.5rem] shadow-sm hover:shadow-xl transition-all duration-300 group flex flex-col gap-6 relative overflow-hidden">

                        {/* Header */}
                        <div className="flex items-start justify-between relative z-10">
                            <div className={`h-16 w-16 rounded-[1.5rem] flex items-center justify-center text-xl font-bold shadow-sm ${staff.avatar_color}`}>
                                {staff.name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <button className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-gray-50 text-gray-400 hover:text-black transition-colors">
                                <MoreHorizontal className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Info */}
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-bold text-lg text-gray-900">{staff.name}</h3>
                                {staff.status === 'on_shift' && (
                                    <span className="h-2 w-2 rounded-full bg-green-500 ring-2 ring-white" />
                                )}
                            </div>
                            <div className="flex flex-wrap gap-2 mb-4">
                                <span className={cn(
                                    "px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider",
                                    staff.role === 'Manager' ? "bg-purple-50 text-purple-600" :
                                        staff.role === 'Head Chef' ? "bg-orange-50 text-orange-600" :
                                            "bg-blue-50 text-blue-600"
                                )}>
                                    {staff.role}
                                </span>
                                <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-yellow-50 text-yellow-700 text-[10px] font-bold">
                                    <Star className="h-3 w-3 fill-yellow-700" />
                                    {staff.rating}
                                </span>
                            </div>

                            {/* Contact Info (Hidden by default, shown on hover maybe? or just always shown) */}
                            <div className="space-y-2">
                                <div className="flex items-center gap-3 text-sm text-gray-500">
                                    <Mail className="h-4 w-4" />
                                    <span className="truncate">{staff.email}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-gray-500">
                                    <Phone className="h-4 w-4" />
                                    <span>{staff.phone}</span>
                                </div>
                            </div>
                        </div>

                        {/* Footer / Stats */}
                        <div className="mt-auto pt-4 border-t border-dashed border-gray-100 relative z-10 flex items-center justify-between">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Tables</span>
                                <span className="text-xl font-bold text-gray-900">{staff.tables_served}</span>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Status</span>
                                <span className={cn(
                                    "text-xs font-bold capitalize",
                                    staff.status === 'on_shift' ? "text-green-600" :
                                        staff.status === 'break' ? "text-orange-500" : "text-gray-400"
                                )}>
                                    {staff.status.replace('_', ' ')}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}

                {/* Add New Staff Card */}
                <button className="group min-h-[300px] rounded-[2.5rem] border-2 border-dashed border-gray-200 hover:border-black/20 bg-gray-50/50 flex flex-col items-center justify-center gap-4 hover:bg-gray-100 transition-all">
                    <div className="h-20 w-20 rounded-[2rem] bg-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                        <Plus className="h-8 w-8 text-gray-400 group-hover:text-black" />
                    </div>
                    <div className="text-center">
                        <h4 className="font-bold text-gray-900 mb-1">Add New Staff</h4>
                        <p className="text-xs font-medium text-gray-400">Invite by email</p>
                    </div>
                </button>
            </div>
        </div>
    );
}
