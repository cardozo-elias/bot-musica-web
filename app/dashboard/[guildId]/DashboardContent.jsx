"use client";
import React from 'react';
import Recommendations from "../../../components/Recommendations";
import RecentlyPlayed from "../../../components/RecentlyPlayed"; 
import { useSocketStats } from "../../../components/SocketContext";
import { useLanguage } from "../../../components/LanguageContext";

export default function DashboardContent({ initialStats, session, guildId, userHistory }) {
    const { socketStats } = useSocketStats();
    const { t } = useLanguage(); 

    const displayHours = socketStats?.listenHours || initialStats.listenTimeHours;
    const displayPlayed = socketStats?.songsPlayed || initialStats.songsPlayed;
    const glowClass = socketStats ? "text-[#a855f7] transition-colors duration-500 drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]" : "text-white";

    return (
        <section className="flex-1 flex flex-col overflow-y-auto custom-scrollbar bg-transparent pb-32 pt-10">
            <div className="p-6 md:p-10 max-w-[1400px] w-full mx-auto flex flex-col gap-10">
            
            {/* Header de Estadísticas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-panel p-6 rounded-3xl flex flex-col shadow-lg border hover:border-[#a855f7]/30 transition-colors">
                    <span className="text-gray-500 text-[10px] uppercase font-bold tracking-widest mb-2">{t('dashboard.stats.saved')}</span>
                    <span className="text-3xl font-black text-white">{initialStats.likesCount}</span>
                </div>
                <div className="glass-panel p-6 rounded-3xl flex flex-col shadow-lg border hover:border-[#a855f7]/30 transition-colors">
                    <span className="text-gray-500 text-[10px] uppercase font-bold tracking-widest mb-2">{t('dashboard.stats.hours')}</span>
                    <span className={`text-3xl font-black ${glowClass}`}>{displayHours}h</span>
                </div>
                <div className="glass-panel p-6 rounded-3xl flex flex-col shadow-lg border hover:border-[#a855f7]/30 transition-colors">
                    <span className="text-gray-500 text-[10px] uppercase font-bold tracking-widest mb-2">{t('dashboard.stats.requested')}</span>
                    <span className={`text-3xl font-black ${glowClass}`}>{displayPlayed}</span>
                </div>
            </div>

            {/* Grid principal de historial y recomendaciones */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mt-2">
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