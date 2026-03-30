import { getServerSession } from "next-auth/next";
import { authOptions } from "./api/auth/[...nextauth]/route";

export default async function LandingPage() {
  const session = await getServerSession(authOptions);
  const targetUrl = session ? "/dashboard" : "/login";
  const buttonText = session ? "Ir al Panel Web" : "Entrar al Panel Web";

  return (
    <main className="min-h-screen bg-[#0a0a0c] text-white flex flex-col items-center justify-center p-10 text-center relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#5865F2] rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#57F287] rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-pulse delay-700"></div>

      <div className="relative z-10 flex flex-col items-center">
        <h1 className="text-6xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#5865F2] to-[#57F287] mb-6 tracking-tighter">
          Musicardi
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl mb-12 leading-relaxed font-medium">
          El bot de música definitivo para Discord. Audio de alta fidelidad, sistema de Autoplay con IA, playlists compartidas y un panel web en tiempo real.
        </p>
        
        <div className="flex flex-col md:flex-row gap-6">
          <a href={targetUrl} className="bg-[#5865F2] px-10 py-5 rounded-2xl font-black uppercase tracking-widest hover:scale-105 transition shadow-xl shadow-[#5865F2]/20">
            {buttonText}
          </a>
          <a href="https://discord.com/api/oauth2/authorize?client_id=TU_ID_AQUI&permissions=8&scope=bot" target="_blank" rel="noreferrer" className="bg-[#2b2d31] hover:bg-white hover:text-black px-10 py-5 rounded-2xl font-black uppercase tracking-widest transition border border-[#3f4147]">
            Invitar a mi Servidor
          </a>
        </div>
      </div>
    </main>
  );
}