"use client";
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from './LanguageContext';
import { openSettingsModal } from './SettingsModal'; 

export default function MobileNav({ userId }) {
  const pathname = usePathname();
  const { t } = useLanguage();

  const navItems = [
    { 
      name: t('nav.home'), href: `/dashboard/${userId}`, 
      icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg> 
    },
    { 
      name: t('nav.playlists'), href: '/playlists', 
      icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" /></svg> 
    },
    { 
      name: t('nav.likes'), href: '/playlists/likes', 
      icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg> 
    },
    { 
      name: t('settings.title'), isButton: true, action: openSettingsModal, 
      icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
    }
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 w-full z-[70] bg-[#0a0a0c]/95 backdrop-blur-xl border-t border-white/5 shadow-[0_-10px_40px_rgba(0,0,0,0.8)] h-[65px] flex justify-around items-center px-2 pb-safe">
      {navItems.map((item) => {
        const isActive = item.href && (pathname === item.href || (item.href === '/playlists' && pathname.includes('/playlists') && !pathname.includes('likes')));
        
        if (item.isButton) {
          return (
            <button key={item.name} onClick={item.action} className="flex flex-col items-center gap-1 p-2 rounded-xl min-w-[70px] transition-all text-gray-500 hover:text-gray-300">
              <div className="transition-transform">{item.icon}</div>
              <span className="text-[10px] font-bold opacity-70">{item.name}</span>
            </button>
          );
        }

        return (
          <Link key={item.name} href={item.href} className={`flex flex-col items-center gap-1 p-2 rounded-xl min-w-[70px] transition-all ${isActive ? 'text-[#a855f7]' : 'text-gray-500 hover:text-gray-300'}`}>
            <div className={`${isActive ? 'scale-110 drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]' : ''} transition-transform`}>{item.icon}</div>
            <span className={`text-[10px] font-bold ${isActive ? 'opacity-100' : 'opacity-70'}`}>{item.name}</span>
          </Link>
        );
      })}
    </div>
  );
}