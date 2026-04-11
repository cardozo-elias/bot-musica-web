"use client";
import React from 'react';
import { openSearchModal } from './WebSearch';

export default function SearchTrigger() {
  return (
    <button 
      onClick={openSearchModal} 
      className="flex items-center gap-3 px-4 py-2.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg font-bold text-sm transition mt-1 w-full text-left"
    >
      🔍 Buscar Canciones
    </button>
  );
}