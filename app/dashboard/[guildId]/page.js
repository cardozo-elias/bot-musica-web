import { getServerSession } from "next-auth/next";
import { authOptions } from "../../api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { Pool } from 'pg';

import LivePlayer from "../../../components/LivePlayer";
import ServerSelector from "../../../components/ServerSelector";
import SidebarFavorites from "../../../components/SidebarFavorites";
import { SocketProvider } from "../../../components/SocketContext";
import DashboardContent from "./DashboardContent"; 

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export default async function DashboardPage({ params }) {
  const resolvedParams = await params;
  const guildId = resolvedParams?.guildId; 
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) redirect('/login');
  
  let stats = { likesCount: 0, listenTimeHours: 0, songsPlayed: 0 };
  let allLikes = [];
  let userPlaylists = [];
  let userHistory = [];
  
  try {
    const likesRes = await pool.query('SELECT COUNT(*) FROM likes WHERE user_id = $1', [session.user.id]);
    stats.likesCount = likesRes.rows[0].count;

    const userStatsRes = await pool.query('SELECT listen_time, songs_played FROM user_stats WHERE user_id = $1', [session.user.id]);
    if (userStatsRes.rows.length > 0) {
      stats.listenTimeHours = (userStatsRes.rows[0].listen_time / 3600).toFixed(1);
      stats.songsPlayed = userStatsRes.rows[0].songs_played;
    }

    const recentLikesRes = await pool.query('SELECT title, artist, video_id as "videoId" FROM likes WHERE user_id = $1 ORDER BY id DESC LIMIT 50', [session.user.id]);
    allLikes = recentLikesRes.rows;

    const plRes = await pool.query('SELECT id, name FROM user_playlists WHERE user_id = $1', [session.user.id]);
    userPlaylists = plRes.rows;

    try {
      const historyRes = await pool.query('SELECT title, artist, video_id as "videoId", played_at as "playedAt" FROM user_history WHERE user_id = $1 ORDER BY played_at DESC LIMIT 30', [session.user.id]);
      userHistory = historyRes.rows;
    } catch(err) {}

  } catch (e) {
    console.error("[WEB DB ERROR]:", e.message);
  }

  return (
    <SocketProvider>
        <main className="h-screen bg-transparent text-white flex overflow-hidden font-sans">
        
        {/* SIDEBAR con Glassmorphism */}
        <aside className="w-[280px] bg-[#0a0a0c]/80 backdrop-blur-xl border-r border-[#1e1f22] flex flex-col pt-8 pb-28 z-10 shadow-[4px_0_24px_rgba(0,0,0,0.5)]">
            <div className="px-4 flex flex-col gap-2 mb-8">
            <div className="px-4 py-1 text-[10px] font-black uppercase text-gray-500 tracking-widest mb-2">Navegación</div>
            
            {/* Botón Activo con Gradiente Violeta/Rosado */}
            <button className="flex items-center gap-3 px-4 py-2.5 bg-gradient-to-r from-[#a855f7] to-[#ec4899] text-white rounded-lg font-bold text-sm shadow-[0_0_15px_rgba(168,85,247,0.3)] transition">
                Panel Principal
            </button>
            <div className="mt-1">
                <ServerSelector userId={session.user.id} currentGuildId={guildId} />
            </div>
            </div>

            {/* 🔥 BOTÓN ESTILO SPOTIFY PARA "TUS ME GUSTA" 🔥 */}
            <a href="/playlists/likes" className="flex items-center gap-4 px-4 py-3 mx-4 mt-2 bg-gradient-to-r from-[#ec4899]/10 to-transparent hover:from-[#ec4899]/20 border border-[#ec4899]/20 hover:border-[#ec4899]/40 rounded-xl transition-all shadow-lg group">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#a855f7] to-[#ec4899] flex items-center justify-center text-white shadow-[0_0_15px_rgba(236,72,153,0.4)] group-hover:scale-105 transition-transform">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                </div>
                <div className="flex flex-col">
                    <span className="text-sm font-bold text-white group-hover:text-[#ec4899] transition-colors">Tus Me Gusta</span>
                    <span className="text-[10px] font-medium text-gray-500">{allLikes.length} canciones</span>
                </div>
            </a>

            <div className="px-4 mt-6 flex flex-col gap-1 flex-1 overflow-y-auto custom-scrollbar">
            <div className="px-4 py-1 text-[10px] font-black uppercase text-gray-500 tracking-widest mb-2 flex justify-between items-center">
                Playlists
                <a href="/playlists" className="text-lg leading-none cursor-pointer text-gray-500 hover:text-[#a855f7] transition">+</a>
            </div>
            {userPlaylists.length === 0 ? (
                <p className="px-4 text-xs text-gray-600 mt-2">No hay playlists.</p>
            ) : (
                userPlaylists.map(pl => (
                <a key={pl.id} href={`/playlists/${pl.id}`} className="flex items-center gap-3 px-4 py-2.5 text-gray-400 hover:text-[#ec4899] hover:bg-[#ec4899]/10 rounded-lg text-sm transition truncate font-medium">
                    📁 {pl.name}
                </a>
                ))
            )}
            </div>

            <div className="px-6 flex items-center gap-4 mt-auto border-t border-[#1e1f22] pt-6 mb-2">
            <img src={session.user.image} className="w-10 h-10 rounded-full border border-[#a855f7]/50" alt="Avatar" />
            <div className="flex flex-col min-w-0">
                <span className="text-sm font-bold truncate text-gray-200">{session.user.name}</span>
                <a href="/api/auth/signout" className="text-[10px] text-gray-500 hover:text-red-400 font-bold uppercase tracking-wider transition">Cerrar Sesión</a>
            </div>
            </div>
        </aside>

        {/* CONTENIDO CENTRAL EN TIEMPO REAL */}
        <DashboardContent 
            initialStats={stats} 
            session={session} 
            guildId={guildId} 
            userHistory={userHistory} 
        />

        <LivePlayer userId={session.user.id} guildId={guildId} />
        </main>
    </SocketProvider>
  );
}