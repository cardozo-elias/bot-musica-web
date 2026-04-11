import { getServerSession } from "next-auth/next";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { Pool } from 'pg';
import Link from "next/link";
import PlaylistsContent from "./PlaylistsContent";
import { SocketProvider } from "../../components/SocketContext";
import LivePlayer from "../../components/LivePlayer";
import MobileNav from "../../components/MobileNav";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export default async function PlaylistsPage() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) redirect('/login');

  let userPlaylists = [];
  let allLikes = [];

  try {
    const plRes = await pool.query('SELECT id, name, songs, is_public FROM user_playlists WHERE user_id = $1 ORDER BY id DESC', [session.user.id]);
    userPlaylists = plRes.rows;

    const likesRes = await pool.query('SELECT id FROM likes WHERE user_id = $1', [session.user.id]);
    allLikes = likesRes.rows;
  } catch (e) {
    console.error(e);
  }

  return (
    <SocketProvider>
      <main className="h-screen bg-transparent text-white flex overflow-hidden font-sans">
        
        {/* SIDEBAR */}
        <aside className="w-[280px] bg-[#0a0a0c]/80 backdrop-blur-xl border-r border-[#1e1f22] flex flex-col pt-8 pb-28 z-10 shadow-[4px_0_24px_rgba(0,0,0,0.5)] hidden md:flex shrink-0">
          <div className="px-4 flex flex-col gap-2 mb-8">
            <div className="px-4 py-1 text-[10px] font-black uppercase text-gray-500 tracking-widest mb-2">Navegación</div>
            <Link href={`/dashboard/${session.user.id}`} className="flex items-center gap-3 px-4 py-2.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg font-bold text-sm transition">
               Panel Principal
            </Link>
            <Link href="/playlists" className="flex items-center gap-3 px-4 py-2.5 bg-gradient-to-r from-[#a855f7] to-[#7e22ce] text-white rounded-lg font-bold text-sm shadow-[0_0_15px_rgba(168,85,247,0.3)] transition mt-1">
               Tus Playlists
            </Link>
          </div>

          <Link href="/playlists/likes" className="flex items-center gap-4 px-4 py-3 mx-4 mt-2 bg-gradient-to-r from-[#7e22ce]/10 to-transparent hover:from-[#7e22ce]/20 border border-[#7e22ce]/20 hover:border-[#7e22ce]/40 rounded-xl transition-all shadow-lg group">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#a855f7] to-[#7e22ce] flex items-center justify-center text-white shadow-[0_0_15px_rgba(126,34,206,0.4)] group-hover:scale-105 transition-transform">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
            </div>
            <div className="flex flex-col">
                <span className="text-sm font-bold text-white group-hover:text-[#a855f7] transition-colors">Tus Me Gusta</span>
                <span className="text-[10px] font-medium text-gray-500">{allLikes.length} canciones</span>
            </div>
          </Link>

          <div className="px-4 mt-6 flex flex-col gap-1 flex-1 overflow-y-auto custom-scrollbar">
            <div className="px-4 py-1 text-[10px] font-black uppercase text-gray-500 tracking-widest mb-2 flex justify-between items-center">
                Tu Biblioteca
            </div>
            {userPlaylists.map(pl => (
              <Link key={pl.id} href={`/playlists/${pl.id}`} className="flex items-center gap-3 px-4 py-2.5 text-gray-400 hover:text-[#a855f7] hover:bg-white/5 rounded-lg text-sm transition truncate font-medium">
                📁 {pl.name}
              </Link>
            ))}
          </div>

          <div className="px-6 flex items-center gap-4 mt-auto border-t border-[#1e1f22] pt-6 mb-2">
            <img src={session.user.image} className="w-10 h-10 rounded-full border border-[#a855f7]/50" alt="Avatar" />
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold truncate text-gray-200">{session.user.name}</span>
              <a href="/api/auth/signout" className="text-[10px] text-gray-500 hover:text-red-400 font-bold uppercase tracking-wider transition">Cerrar Sesión</a>
            </div>
          </div>
        </aside>

        <PlaylistsContent initialPlaylists={userPlaylists} />
        
        <MobileNav userId={session.user.id} />
        <LivePlayer userId={session.user.id} />
      </main>
    </SocketProvider>
  );
}