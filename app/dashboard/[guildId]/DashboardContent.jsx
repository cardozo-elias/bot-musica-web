"use client";
import React from 'react';
import Link from 'next/link'; 
import Recommendations from "../../../components/Recommendations";
import RecentlyPlayed from "../../../components/RecentlyPlayed"; 
import { useSocketStats } from "../../../components/SocketContext";
import { useLanguage } from "../../../components/LanguageContext"; // 👇 Importamos hook

export default function DashboardContent({ initialStats, session, guildId, userHistory }) {
    const { socketStats } = useSocketStats();
    const { t } = useLanguage(); // 👇 Invocamos hook

    const displayHours = socketStats?.listenHours || initialStats.listenTimeHours;
    const displayPlayed = socketStats?.songsPlayed || initialStats.songsPlayed;
    const glowClass = socketStats ? "text-[#a855f7] transition-colors duration-500 drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]" : "text-white";

    return (
        <section className="flex-1 flex flex-col overflow-y-auto custom-scrollbar bg-transparent pb-32 pt-10">
            <div className="p-6 md:p-10 max-w-[1400px] w-full mx-auto flex flex-col gap-10">
            
            {/* Header de Estadísticas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-panel p-6 rounded-2xl flex flex-col shadow-lg border hover:border-[#a855f7]/30 transition-colors">
                    <span className="text-gray-500 text-[10px] uppercase font-bold tracking-widest mb-2">{t('dashboard.stats.saved')}</span>
                    <span className="text-3xl font-black text-white">{initialStats.likesCount}</span>
                </div>
                <div className="glass-panel p-6 rounded-2xl flex flex-col shadow-lg border hover:border-[#a855f7]/30 transition-colors">
                    <span className="text-gray-500 text-[10px] uppercase font-bold tracking-widest mb-2">{t('dashboard.stats.hours')}</span>
                    <span className={`text-3xl font-black ${glowClass}`}>{displayHours}h</span>
                </div>
                <div className="glass-panel p-6 rounded-2xl flex flex-col shadow-lg border hover:border-[#a855f7]/30 transition-colors">
                    <span className="text-gray-500 text-[10px] uppercase font-bold tracking-widest mb-2">{t('dashboard.stats.requested')}</span>
                    <span className={`text-3xl font-black ${glowClass}`}>{displayPlayed}</span>
                </div>
            </div>

            {/* TARJETA RÁPIDA A PLAYLISTS */}
            <Link href="/playlists" className="group relative block w-full md:w-1/3 h-[140px] rounded-2xl overflow-hidden outline-none shadow-lg -mt-4">
              <div className="absolute inset-0 bg-[#0a0a0c]/80 backdrop-blur-xl border border-white/5 rounded-2xl transition-colors group-hover:border-[#a855f7]/50 z-10"></div>
              <div className="absolute inset-0 bg-gradient-to-br from-[#a855f7]/0 to-[#7e22ce]/0 group-hover:from-[#a855f7]/20 group-hover:to-[#7e22ce]/20 transition-all duration-500 z-10"></div>
              <div className="absolute inset-0 z-20 p-6 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[#a855f7] shadow-inner group-hover:scale-110 group-hover:border-[#a855f7]/50 transition-all duration-300">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>
                  </div>
                  <svg className="w-5 h-5 text-gray-600 group-hover:text-[#a855f7] transition-colors transform group-hover:translate-x-1 group-hover:-translate-y-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                </div>
                <div>
                  <h3 className="text-lg font-black text-white tracking-tight group-hover:bg-clip-text group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-[#a855f7] group-hover:to-[#7e22ce] transition-all">
                    {t('nav.playlists')}
                  </h3>
                  <p className="text-[11px] text-gray-500 font-medium">{t('playlists.subtitle')}</p>
                </div>
              </div>
            </Link>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                <div className="w-full">
                  <RecentlyPlayed history={userHistory} userId={session.user.id} userName={session.user.name} userAvatar={session.user.image} />
                </div>
                <div className="w-full">
                  <Recommendations userId={session.user.id} userName={session.user.name} userAvatar={session.user.image} />
                </div>
            </div>

            </div>
        </section>
    );
}