"use client";
import { signIn } from "next-auth/react";
import { useState, useEffect } from "react";
import { dictionaries } from "../../utils/dictionary";

// Íconos SVG
const DiscordIcon = () => <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"/></svg>;
const MusicIcon = () => <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>;

export default function LoginPage() {
  const [lang, setLang] = useState("es"); // Español por defecto

  useEffect(() => {
    const match = document.cookie.match(/(^| )locale=([^;]+)/);
    if (match) setLang(match[2]);
  }, []);

  const handleLanguageChange = (newLang) => {
    setLang(newLang);
    document.cookie = `locale=${newLang}; path=/; max-age=31536000`; 
  };

  return (
    <main className="h-screen bg-[#0a0a0c] flex flex-col items-center justify-center font-sans text-white relative">
      
      {/* Selector de Idioma Minimalista */}
      <div className="absolute top-6 right-6 flex gap-2 bg-white/5 p-1 rounded-xl border border-white/10">
        <button 
          onClick={() => handleLanguageChange("en")} 
          className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${lang === "en" ? "bg-[#7e22ce] text-white" : "text-gray-400 hover:text-white"}`}
        >
          EN
        </button>
        <button 
          onClick={() => handleLanguageChange("es")} 
          className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${lang === "es" ? "bg-[#7e22ce] text-white" : "text-gray-400 hover:text-white"}`}
        >
          ES
        </button>
      </div>

      <div className="flex flex-col items-center gap-6 max-w-sm w-full p-8">
        <div className="w-20 h-20 bg-gradient-to-br from-[#a855f7] to-[#7e22ce] rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(126,34,206,0.5)]">
          <MusicIcon />
        </div>
        
        <div className="text-center">
          <h1 className="text-3xl font-black tracking-tight mb-2">Musicardi</h1>
          <p className="text-sm text-gray-500 font-medium">
            {dictionaries[lang].login.title}
          </p>
        </div>

        <button 
          onClick={() => signIn("discord")} 
          className="w-full py-3.5 bg-[#5865F2] hover:bg-[#4752C4] text-white rounded-xl font-bold shadow-lg transition-colors flex items-center justify-center gap-3 mt-4"
        >
          <DiscordIcon />
          {dictionaries[lang].login.button}
        </button>
      </div>
    </main>
  );
}