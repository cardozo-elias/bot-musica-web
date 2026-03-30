import { getServerSession } from "next-auth/next";
import { authOptions } from "./api/auth/[...nextauth]/route";

export default async function LandingPage() {
  const session = await getServerSession(authOptions);

  return (
    <main className="min-h-screen bg-[#0a0a0c] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Fondo decorativo */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#5865F2]/10 via-transparent to-transparent -z-10"></div>

      <div className="text-center max-w-2xl">
        <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-500">
          Musicardi
        </h1>
        <p className="text-gray-400 text-lg md:text-xl font-medium mb-10 leading-relaxed">
          El bot de música definitivo para Discord. Audio de alta fidelidad, sistema de Autoplay con IA y un panel web en tiempo real.
        </p>

        <div className="flex flex-col md:flex-row gap-4 justify-center">
          {/* BOTÓN ACTUALIZADO (OPCIÓN B) */}
          <a 
            href={session ? "/dashboard/select" : "/login"} 
            className="bg-[#5865F2] hover:bg-[#4752C4] text-white px-10 py-4 rounded-2xl font-black uppercase text-sm tracking-widest transition transform hover:scale-105 shadow-2xl shadow-[#5865F2]/20"
          >
            {session ? "Entrar al Panel Web" : "Iniciar Sesión"}
          </a>

          <a 
            href="https://discord.com/api/oauth2/authorize?client_id=TU_CLIENT_ID&permissions=8&scope=bot%20applications.commands" 
            target="_blank"
            className="bg-[#111214] border border-[#2b2d31] hover:bg-white hover:text-black text-white px-10 py-4 rounded-2xl font-black uppercase text-sm tracking-widest transition transform hover:scale-105"
          >
            Invitar a mi Servidor
          </a>
        </div>
      </div>

      {/* Footer simple */}
      <footer className="absolute bottom-8 text-gray-600 text-[10px] font-black uppercase tracking-[0.3em]">
        © 2026 Musicardi Team • Built with Next.js
      </footer>
    </main>
  );
}