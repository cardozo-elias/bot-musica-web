"use client";
import React from "react";
import Recommendations from "../../../components/Recommendations";
import RecentlyPlayed from "../../../components/RecentlyPlayed";
import { useSocketStats } from "../../../components/SocketContext";
import { useLanguage } from "../../../components/LanguageContext";

export default function DashboardContent({
  initialStats,
  session,
  userHistory,
}) {
  const { socketStats } = useSocketStats();
  const { t } = useLanguage();

  const displayHours = socketStats?.listenHours || initialStats.listenTimeHours;
  const displayPlayed = socketStats?.songsPlayed || initialStats.songsPlayed;

  return (
    <>
      <section className="flex-1 flex flex-col overflow-y-auto custom-scrollbar bg-transparent pb-32 pt-10">
        <div className="p-6 md:p-10 max-w-[1400px] w-full mx-auto flex flex-col gap-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div 
              className="glass-panel p-6 rounded-3xl flex flex-col shadow-lg border border-transparent transition-colors duration-500 hover:border-[var(--dynamic-color-40)]"
            >
              <span className="text-gray-500 text-[10px] uppercase font-bold tracking-widest mb-2">
                {t("dashboard.stats.saved")}
              </span>
              <span className="text-3xl font-black text-white">
                {initialStats.likesCount}
              </span>
            </div>
            
            <div 
              className="glass-panel p-6 rounded-3xl flex flex-col shadow-lg border border-transparent transition-colors duration-500 hover:border-[var(--dynamic-color-40)]"
            >
              <span className="text-gray-500 text-[10px] uppercase font-bold tracking-widest mb-2">
                {t("dashboard.stats.hours")}
              </span>
              <span 
                className="text-3xl font-black transition-colors duration-1000"
                style={{ 
                  color: 'var(--dynamic-color)', 
                  filter: 'drop-shadow(0 0 10px var(--dynamic-color-50))' 
                }}
              >
                {displayHours}h
              </span>
            </div>

            <div 
              className="glass-panel p-6 rounded-3xl flex flex-col shadow-lg border border-transparent transition-colors duration-500 hover:border-[var(--dynamic-color-40)]"
            >
              <span className="text-gray-500 text-[10px] uppercase font-bold tracking-widest mb-2">
                {t("dashboard.stats.requested")}
              </span>
              <span 
                className="text-3xl font-black transition-colors duration-1000"
                style={{ 
                  color: 'var(--dynamic-color)', 
                  filter: 'drop-shadow(0 0 10px var(--dynamic-color-50))' 
                }}
              >
                {displayPlayed}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mt-2">
            <div className="w-full">
              <RecentlyPlayed
                history={userHistory}
                userId={session.user.id}
                userName={session.user.name}
                userAvatar={session.user.image}
              />
            </div>
            <div className="w-full">
              <Recommendations
                userId={session.user.id}
                userName={session.user.name}
                userAvatar={session.user.image}
              />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}