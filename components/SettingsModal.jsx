"use client";
import React, { useState, useEffect } from 'react';
import { useLanguage } from './LanguageContext';

export const openSettingsModal = () => {
  if (typeof window !== "undefined") window.dispatchEvent(new Event("open-settings-modal"));
};

// Íconos SVG
const CloseIcon = () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;
const GlobeIcon = () => <svg className="w-5 h-5 text-[#a855f7]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>;

export default function SettingsModal() {
  const [isOpen, setIsOpen] = useState(false);
  const { lang, changeLanguage, t } = useLanguage();

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener("open-settings-modal", handleOpen);
    return () => window.removeEventListener("open-settings-modal", handleOpen);
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] bg-[#0a0a0c]/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
      <div className="w-full max-w-sm glass-panel bg-[#111214]/95 rounded-3xl shadow-[0_0_50px_rgba(126,34,206,0.15)] border border-[#7e22ce]/30 flex flex-col overflow-hidden animate-slideUp">
        
        {/* Cabecera */}
        <div className="flex justify-between items-center p-6 border-b border-white/5">
          <h3 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
            <svg className="w-6 h-6 text-[#7e22ce]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            {t('settings.title')}
          </h3>
          <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-white transition"><CloseIcon /></button>
        </div>

        {/* Contenido */}
        <div className="p-6 flex flex-col gap-6">
            
          {/* Sección: Idioma */}
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                <GlobeIcon /> {t('settings.language')}
            </h4>
            <div className="grid grid-cols-2 gap-3">
                <button 
                    onClick={() => changeLanguage('es')}
                    className={`p-3 rounded-xl border text-sm font-bold transition-all ${lang === 'es' ? 'bg-[#7e22ce]/20 border-[#a855f7] text-white shadow-[0_0_15px_rgba(168,85,247,0.2)]' : 'border-white/10 text-gray-400 hover:bg-white/5 hover:text-white'}`}
                >
                    🇪🇸 {t('settings.spanish')}
                </button>
                <button 
                    onClick={() => changeLanguage('en')}
                    className={`p-3 rounded-xl border text-sm font-bold transition-all ${lang === 'en' ? 'bg-[#7e22ce]/20 border-[#a855f7] text-white shadow-[0_0_15px_rgba(168,85,247,0.2)]' : 'border-white/10 text-gray-400 hover:bg-white/5 hover:text-white'}`}
                >
                    🇺🇸 {t('settings.english')}
                </button>
            </div>
          </div>

        </div>

        <div className="p-6 border-t border-white/5 bg-black/20">
            <button onClick={() => setIsOpen(false)} className="w-full py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition">
                {t('settings.close')}
            </button>
        </div>

      </div>
    </div>
  );
}