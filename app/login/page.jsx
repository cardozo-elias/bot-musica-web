"use client";
import { signIn } from "next-auth/react";
import { useLanguage } from "../../components/LanguageContext";

const DiscordIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" />
  </svg>
);
const MusicIcon = () => (
  <svg
    className="w-10 h-10 text-white drop-shadow-md"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
    />
  </svg>
);
const GlobeIcon = () => (
  <svg
    className="w-4 h-4"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
    />
  </svg>
);

export default function LoginPage() {
  const { t, lang, changeLanguage } = useLanguage();

  return (
    <main className="h-screen bg-[#0a0a0c] flex flex-col items-center justify-center font-sans text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#a855f7]/15 via-[#0a0a0c] to-[#0a0a0c]"></div>

      <div className="absolute top-6 right-6 flex items-center gap-1 glass-panel bg-white/5 p-1.5 rounded-xl border border-white/10 shadow-lg z-10">
        <div className="pl-2 pr-1 text-gray-500">
          <GlobeIcon />
        </div>
        <button
          onClick={() => changeLanguage("en")}
          className={`px-3 py-1.5 rounded-lg text-[11px] font-black tracking-wider transition-all ${lang === "en" ? "bg-gradient-to-r from-[#a855f7] to-[#7e22ce] text-white shadow-md" : "text-gray-400 hover:text-white"}`}
        >
          EN
        </button>
        <button
          onClick={() => changeLanguage("es")}
          className={`px-3 py-1.5 rounded-lg text-[11px] font-black tracking-wider transition-all ${lang === "es" ? "bg-gradient-to-r from-[#a855f7] to-[#7e22ce] text-white shadow-md" : "text-gray-400 hover:text-white"}`}
        >
          ES
        </button>
      </div>

      <div className="glass-panel p-10 md:p-14 rounded-[2.5rem] border border-white/5 shadow-2xl flex flex-col items-center gap-6 max-w-md w-[90%] z-10 animate-slideUp relative overflow-hidden">
        <div className="w-20 h-20 bg-gradient-to-br from-[#a855f7] to-[#7e22ce] rounded-3xl flex items-center justify-center shadow-[0_0_40px_rgba(168,85,247,0.4)] transform hover:scale-105 transition-transform duration-500">
          <MusicIcon />
        </div>

        <div className="text-center flex flex-col gap-2">
          <h1 className="text-4xl font-black tracking-tighter text-white">
            Musicardi
          </h1>
          <p className="text-sm text-gray-400 font-medium">
            {t("login.title")}
          </p>
        </div>

        <button
          onClick={() => signIn("discord", { callbackUrl: "/dashboard" })}
          className="w-full mt-4 py-4 bg-[#5865F2] hover:bg-[#4752C4] text-white rounded-2xl font-bold shadow-[0_10px_20px_rgba(88,101,242,0.3)] hover:shadow-[0_10px_25px_rgba(88,101,242,0.5)] transition-all hover:-translate-y-1 flex items-center justify-center gap-3"
        >
          <DiscordIcon />
          <span className="tracking-wide">{t("login.button")}</span>
        </button>
      </div>
    </main>
  );
}
