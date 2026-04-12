"use client";
import React, { useState, useEffect } from 'react';
import { useLanguage } from './LanguageContext';
import { io } from "socket.io-client";
import { useSession } from "next-auth/react";

// 🔥 LA MAGIA: Esta función le avisa al componente que se abra desde cualquier lugar
export const openSettingsModal = () => {
    if (typeof window !== "undefined") window.dispatchEvent(new Event("open-settings-modal"));
};

export default function SettingsModal() {
    const { data: session } = useSession();
    const userId = session?.user?.id;
    
    const { t, language, setLanguage } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('general');
    
    // Estados de Preferencias
    const [prefs, setPrefs] = useState({
        incognito: false,
        low_res_covers: false,
        default_filter: 'clear',
        accent_color: '#a855f7'
    });

    // Escuchador de apertura
    useEffect(() => {
        const handleOpen = () => setIsOpen(true);
        window.addEventListener("open-settings-modal", handleOpen);
        return () => window.removeEventListener("open-settings-modal", handleOpen);
    }, []);

    // Cargar preferencias cuando se abre
    useEffect(() => {
        if (!isOpen || !userId) return;
        let rawUrl = process.env.NEXT_PUBLIC_BOT_URL || "http://localhost:3001";
        let secureUrl = rawUrl.replace("https://", "wss://").replace("http://", "ws://");
        
        const socket = io(secureUrl, { 
            transports: ["websocket"], 
            upgrade: false,
            extraHeaders: { "ngrok-skip-browser-warning": "true" } 
        });
        
        socket.emit("get_preferences", userId);
        socket.on("preferences_data", (data) => {
            setPrefs(data);
        });

        return () => socket.disconnect();
    }, [isOpen, userId]);

    const handleSave = () => {
        if (!userId) return;
        let rawUrl = process.env.NEXT_PUBLIC_BOT_URL || "http://localhost:3001";
        let secureUrl = rawUrl.replace("https://", "wss://").replace("http://", "ws://");
        
        const socket = io(secureUrl, { 
            transports: ["websocket"], 
            upgrade: false,
            extraHeaders: { "ngrok-skip-browser-warning": "true" } 
        });
        
        socket.emit("save_preferences", { userId, prefs });
        setTimeout(() => socket.disconnect(), 1000);
        setIsOpen(false); // Cierra el modal
    };

    // Si no está abierto, no renderiza nada y no gasta recursos
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
            <div className="w-full max-w-2xl glass-panel bg-[#111214]/95 rounded-3xl shadow-2xl border border-white/10 flex flex-col overflow-hidden animate-slideUp">
                
                {/* Header */}
                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-black/20">
                    <h2 className="text-2xl font-black text-white">{t('settings.title')}</h2>
                    <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-white transition text-3xl leading-none">&times;</button>
                </div>

                <div className="flex flex-col md:flex-row h-[60vh] md:h-[500px]">
                    {/* Sidebar Tabs */}
                    <div className="w-full md:w-1/3 border-b md:border-b-0 md:border-r border-white/5 p-4 flex flex-row md:flex-col gap-2 overflow-x-auto custom-scrollbar bg-black/10">
                        <button onClick={() => setActiveTab('general')} className={`text-left px-4 py-3 rounded-xl font-bold transition ${activeTab === 'general' ? 'bg-[#a855f7]/20 text-[#a855f7] border border-[#a855f7]/30' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>🌐 General</button>
                        <button onClick={() => setActiveTab('privacy')} className={`text-left px-4 py-3 rounded-xl font-bold transition ${activeTab === 'privacy' ? 'bg-[#a855f7]/20 text-[#a855f7] border border-[#a855f7]/30' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>🕵️ Privacidad</button>
                        <button onClick={() => setActiveTab('audio')} className={`text-left px-4 py-3 rounded-xl font-bold transition ${activeTab === 'audio' ? 'bg-[#a855f7]/20 text-[#a855f7] border border-[#a855f7]/30' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>🎧 Audio & Visual</button>
                    </div>

                    {/* Content Area */}
                    <div className="w-full md:w-2/3 p-6 overflow-y-auto custom-scrollbar">
                        
                        {activeTab === 'general' && (
                            <div className="flex flex-col gap-6 animate-fadeIn">
                                <div>
                                    <label className="block text-sm font-bold text-gray-400 mb-3 uppercase tracking-widest">{t('settings.language')}</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button onClick={() => setLanguage('es')} className={`p-4 rounded-2xl border transition font-bold ${language === 'es' ? 'bg-[#a855f7] border-[#a855f7] text-white shadow-lg' : 'bg-black/20 border-white/10 text-gray-400 hover:bg-white/5'}`}>Español</button>
                                        <button onClick={() => setLanguage('en')} className={`p-4 rounded-2xl border transition font-bold ${language === 'en' ? 'bg-[#a855f7] border-[#a855f7] text-white shadow-lg' : 'bg-black/20 border-white/10 text-gray-400 hover:bg-white/5'}`}>English</button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'privacy' && (
                            <div className="flex flex-col gap-6 animate-fadeIn">
                                <div className="glass-panel p-5 rounded-2xl border border-white/5 flex items-center justify-between">
                                    <div className="flex flex-col pr-4">
                                        <span className="text-white font-bold">Modo Incógnito</span>
                                        <span className="text-xs text-gray-500 mt-1">No registrar lo que escucho en mi perfil público ni en mis estadísticas.</span>
                                    </div>
                                    <button onClick={() => setPrefs({...prefs, incognito: !prefs.incognito})} className={`w-14 h-7 rounded-full flex items-center transition-colors px-1 shrink-0 ${prefs.incognito ? 'bg-[#a855f7]' : 'bg-gray-700'}`}>
                                        <div className={`w-5 h-5 bg-white rounded-full transition-transform shadow-md ${prefs.incognito ? 'translate-x-7' : 'translate-x-0'}`}></div>
                                    </button>
                                </div>
                                <button className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 p-4 rounded-2xl font-bold transition">
                                    🗑️ Borrar mi Historial de Reproducción
                                </button>
                            </div>
                        )}

                        {activeTab === 'audio' && (
                            <div className="flex flex-col gap-6 animate-fadeIn">
                                <div>
                                    <label className="block text-sm font-bold text-gray-400 mb-3 uppercase tracking-widest">Filtro Acústico Base</label>
                                    <select 
                                        value={prefs.default_filter} 
                                        onChange={(e) => setPrefs({...prefs, default_filter: e.target.value})}
                                        className="w-full bg-black/20 border border-white/10 text-white rounded-xl p-4 outline-none font-bold appearance-none cursor-pointer focus:border-[#a855f7]"
                                    >
                                        <option value="clear">Ninguno (Calidad Original)</option>
                                        <option value="bass=g=15">Bassboost (Graves Profundos)</option>
                                        <option value="apulsator=hz=0.09">8D Audio (Inmersivo)</option>
                                        <option value="asetrate=44100*1.25,aresample=44100,atempo=1">Nightcore</option>
                                    </select>
                                </div>
                                <div className="glass-panel p-5 rounded-2xl border border-white/5 flex items-center justify-between mt-2">
                                    <div className="flex flex-col pr-4">
                                        <span className="text-white font-bold">Portadas de Baja Resolución</span>
                                        <span className="text-xs text-gray-500 mt-1">Ideal para conexiones lentas o ahorrar RAM.</span>
                                    </div>
                                    <button onClick={() => setPrefs({...prefs, low_res_covers: !prefs.low_res_covers})} className={`w-14 h-7 rounded-full flex items-center transition-colors px-1 shrink-0 ${prefs.low_res_covers ? 'bg-[#a855f7]' : 'bg-gray-700'}`}>
                                        <div className={`w-5 h-5 bg-white rounded-full transition-transform shadow-md ${prefs.low_res_covers ? 'translate-x-7' : 'translate-x-0'}`}></div>
                                    </button>
                                </div>
                            </div>
                        )}

                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-white/5 bg-black/40 flex justify-end gap-3">
                    <button onClick={() => setIsOpen(false)} className="px-6 py-2.5 rounded-full font-bold text-gray-400 hover:text-white transition">{t('common.cancel')}</button>
                    <button onClick={handleSave} className="px-8 py-2.5 rounded-full font-bold bg-[#a855f7] text-white hover:brightness-110 transition shadow-[0_0_15px_rgba(168,85,247,0.4)]">{t('common.save')}</button>
                </div>
            </div>
        </div>
    );
}