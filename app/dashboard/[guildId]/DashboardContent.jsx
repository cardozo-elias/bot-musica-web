"use client";
import React from 'react';
import WebSearch from "../../../components/WebSearch";
import Recommendations from "../../../components/Recommendations";
import RecentlyPlayed from "../../../components/RecentlyPlayed"; 
import { useSocketStats } from "../../../components/SocketContext";

export default function DashboardContent({ initialStats, session, guildId, userHistory }) {
    // Escuchamos los datos en tiempo real que inyecta LivePlayer
    const { socketStats } = useSocketStats();

    // Priorizamos los datos en tiempo real. Si no hay conexión aún, usamos la DB estática.
    const displayHours = socketStats?.listenHours || initialStats.listenTimeHours;
    const displayPlayed = socketStats?.songsPlayed || initialStats.songsPlayed;
    // Agregamos animación verde sutil al actualizar
    const glowClass = socketStats ? "text-[#57F287] transition-colors duration-500" : "text-white";

    return (
        <section className="flex-1 flex flex-col overflow-y-auto custom-scrollbar bg-[#0a0a0c] pb-32">
            <div className="p-6 md:p-10 max-w-[1400px] w-full mx-auto flex flex-col gap-10">
            
            {/* Header de Estadísticas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-[#111214] p-6 rounded-2xl border border-[#1e1f22] flex flex-col shadow-sm">
                    <span className="text-gray-500 text-[10px] uppercase font-bold tracking-widest mb-2">Pistas Guardadas</span>
                    <span className="text-3xl font-black text-white">{initialStats.likesCount}</span>
                </div>
                <div className="bg-[#111214] p-6 rounded-2xl border border-[#1e1f22] flex flex-col shadow-sm">
                    <span className="text-gray-500 text-[10px] uppercase font-bold tracking-widest mb-2">Horas Escuchadas</span>
                    <span className={`text-3xl font-black ${glowClass}`}>{displayHours}h</span>
                </div>
                <div className="bg-[#111214] p-6 rounded-2xl border border-[#1e1f22] flex flex-col shadow-sm">
                    <span className="text-gray-500 text-[10px] uppercase font-bold tracking-widest mb-2">Solicitadas</span>
                    <span className={`text-3xl font-black ${glowClass}`}>{displayPlayed}</span>
                </div>
            </div>

            <div className="w-full">
                <WebSearch userId={session.user.id} userName={session.user.name} userAvatar={session.user.image} guildId={guildId} />
            </div>

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