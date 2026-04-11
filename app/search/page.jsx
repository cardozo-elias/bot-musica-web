import { getServerSession } from "next-auth/next";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import Link from "next/link";
import { SocketProvider } from "../../components/SocketContext";
import LivePlayer from "../../components/LivePlayer";
import MobileNav from "../../components/MobileNav"; // El nuevo menú móvil
import SearchClient from "./SearchClient";

export default async function SearchPage({ searchParams }) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) redirect('/login');
  
  // Extraemos el parámetro ?q= de la URL si existe
  const query = await searchParams?.q || "";

  return (
    <SocketProvider>
      <main className="h-screen bg-[#0a0a0c] text-white flex overflow-hidden font-sans">
        
        {/* SIDEBAR DE ESCRITORIO (Oculto en Móvil) */}
        <aside className="w-[280px] bg-[#0a0a0c]/80 backdrop-blur-xl border-r border-white/5 flex flex-col pt-8 pb-28 z-10 shadow-[4px_0_24px_rgba(0,0,0,0.5)] shrink-0 hidden md:flex">
          <div className="px-4 flex flex-col gap-2 mb-8">
            <div className="px-4 py-1 text-[10px] font-black uppercase text-gray-500 tracking-widest mb-2">Navegación</div>
            <Link href={`/dashboard/${session.user.id}`} className="flex items-center gap-3 px-4 py-2.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg font-bold text-sm transition">
               Panel Principal
            </Link>
            <Link href="/search" className="flex items-center gap-3 px-4 py-2.5 bg-gradient-to-r from-[#a855f7]/20 to-[#7e22ce]/20 border border-[#a855f7]/30 text-white rounded-lg font-bold text-sm transition mt-1 shadow-inner">
               🔍 Buscador Global
            </Link>
            <Link href="/playlists" className="flex items-center gap-3 px-4 py-2.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg font-bold text-sm transition mt-1">
               Tus Playlists
            </Link>
          </div>
          
          <div className="mt-auto px-6 flex items-center gap-4 border-t border-white/5 pt-6 mb-2">
            <img src={session.user.image} className="w-10 h-10 rounded-full border border-[#a855f7]/50" alt="Avatar" />
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold truncate text-gray-200">{session.user.name}</span>
              <a href="/api/auth/signout" className="text-[10px] text-gray-500 hover:text-red-400 font-bold uppercase tracking-wider transition">Cerrar Sesión</a>
            </div>
          </div>
        </aside>

        {/* EL CLIENTE DEL BUSCADOR */}
        <SearchClient initialQuery={query} session={session} />

        {/* NAVEGACIÓN MÓVIL Y REPRODUCTOR GLOBAL */}
        <MobileNav userId={session.user.id} />
        <LivePlayer userId={session.user.id} />
        
      </main>
    </SocketProvider>
  );
}