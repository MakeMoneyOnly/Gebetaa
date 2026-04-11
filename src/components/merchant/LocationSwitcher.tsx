'use client';

import React, { useState } from 'react';
import { MapPin, ChevronDown, Check, Globe, Plus } from 'lucide-react';

const locations = [
  { id: 'all', name: 'All Locations', branch: 'Addis Ababa', icon: Globe },
  { id: '1', name: 'Cafe Lucia', branch: 'Bole' },
  { id: '2', name: 'Cafe Lucia', branch: 'Kazanchis' },
  { id: '3', name: 'Cafe Lucia', branch: 'Piassa' },
  { id: '4', name: 'Cafe Lucia', branch: 'Sarbet' },
  { id: '5', name: 'Cafe Lucia', branch: 'CMC' },
];

export function LocationSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(locations[2]); // Default to Kazanchis for demo

  return (
    <div className="relative font-inter tracking-[-0.04em]">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 h-14 px-2 hover:opacity-80 transition-all focus:outline-none group"
      >
        <div className="flex items-center justify-center text-gray-400 group-hover:text-black transition-colors">
          {selectedLocation.icon ? (
            <selectedLocation.icon className="h-5 w-5" />
          ) : (
            <MapPin className="h-5 w-5" />
          )}
        </div>
        
        <div className="flex flex-col items-start leading-tight">
          <span className="text-sm font-bold text-gray-900">
            {selectedLocation.name}
          </span>
          <span className="text-xs font-medium text-gray-500">
            {selectedLocation.branch}
          </span>
        </div>

        <ChevronDown 
          className={`h-4 w-4 text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} 
          strokeWidth={2.5}
        />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-50 px-2" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 mt-1 z-50 w-64 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl shadow-black/10 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="p-2">
              <div className="grid gap-1">
                {locations.map((location) => {
                  const Icon = location.icon || MapPin;
                  const isSelected = selectedLocation.id === location.id;
                  
                  return (
                    <button
                      key={location.id}
                      onClick={() => {
                        setSelectedLocation(location);
                        setIsOpen(false);
                      }}
                      className={`flex items-center gap-3 w-full p-2.5 rounded-xl transition-all ${
                        isSelected 
                          ? 'bg-gray-50 text-gray-900' 
                          : 'hover:bg-gray-50/80 text-gray-500 hover:text-gray-900'
                      }`}
                    >
                      <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                        isSelected 
                          ? 'bg-brand-accent text-black' 
                          : 'bg-gray-50 text-gray-400'
                      }`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      
                      <div className="flex flex-col items-start overflow-hidden leading-tight">
                        <span className="text-sm font-bold truncate w-full">
                          {location.name}
                        </span>
                        <span className="text-micro font-medium text-gray-400">
                          {location.branch}
                        </span>
                      </div>

                      {isSelected && (
                        <Check className="ml-auto mr-1 h-3.5 w-3.5 text-gray-900" strokeWidth={3} />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
            
            <div className="border-t border-gray-50 p-2">
              <button className="flex items-center justify-center gap-2 w-full p-2.5 text-xs font-bold text-gray-500 hover:text-gray-900 transition-colors">
                <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
                Add New Location
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
