"use client";
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function MobileNav({ userId }) {
  const pathname = usePathname();

  const navItems = [
    { 
      name: 'Inicio', 
      href: `/dashboard/${userId}`, 
      icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg> 
    },
    { 
      name: 'Buscar', 
      href: '/search', 
      icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg> 
    },
    { 
      name: 'Listas', 
      href: '/playlists', 
      icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" /></svg> 
    },
    { 
      name: 'Likes', 
      href: '/playlists/likes', 
      icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg> 
    }
  ];

  return (
    <div className="md:hidden fixed bottom-[90px] left-0 w-full z-[50] bg-[#0a0a0c]/90 backdrop-blur-xl border-t border-white/5 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
      <div className="flex justify-around items-center p-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.name === 'Listas' && pathname.includes('/playlists') && !pathname.includes('likes'));
          return (
            <Link 
              key={item.name} 
              href={item.href} 
              className={`flex flex-col items-center gap-1 p-2 rounded-xl min-w-[64px] transition-all ${isActive ? 'text-[#a855f7]' : 'text-gray-500 hover:text-gray-300'}`}
            >
              <div className={`${isActive ? 'scale-110 drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]' : ''} transition-transform`}>
                {item.icon}
              </div>
              <span className={`text-[10px] font-bold ${isActive ? 'opacity-100' : 'opacity-70'}`}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}