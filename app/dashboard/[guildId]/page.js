import { getServerSession } from "next-auth/next";
import { authOptions } from "../../api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { Pool } from 'pg';

import LivePlayer from "../../../components/LivePlayer";
import WebSearch from "../../../components/WebSearch";
import Recommendations from "../../../components/Recommendations";
import ServerSelector from "../../../components/ServerSelector";
import RecentlyPlayed from "../../../components/RecentlyPlayed"; 
import SidebarFavorites from "../../../components/SidebarFavorites";
import { SocketProvider } from "../../../components/SocketContext";
import DashboardContent from "./DashboardContent"; // Nuesto nuevo cliente

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
        <main className="h-screen bg-[#0a0a0c] text-white flex overflow-hidden font-sans">
        
        {/* SIDEBAR */}
        <aside className="w-[280px] bg-[#000000] border-r border-[#1e1f22] flex flex-col pt-8 pb-28 z-10 shadow-xl">
            <div className="px-4 flex flex-col gap-2 mb-8">
            <div className="px-4 py-1 text-[10px] font-black uppercase text-gray-600 tracking-widest mb-2">Navegación</div>
            <button className="flex items-center gap-3 px-4 py-2.5 bg-[#1e1f22] text-white rounded-lg font-bold text-sm transition">
                Panel Principal
            </button>
            <div className="mt-1">
                <ServerSelector userId={session.user.id} currentGuildId={guildId} />
            </div>
            </div>

            <SidebarFavorites 
            initialLikes={allLikes} 
            userId={session.user.id} 
            userName={session.user.name} 
            userAvatar={session.user.image} 
            />

            <div className="px-4 mt-6 flex flex-col gap-1 flex-1 overflow-y-auto custom-scrollbar">
            <div className="px-4 py-1 text-[10px] font-black uppercase text-gray-600 tracking-widest mb-2 flex justify-between items-center">
                Playlists
                <a href="/playlists" className="text-lg leading-none cursor-pointer text-gray-500 hover:text-white transition">+</a>
            </div>
            {userPlaylists.length === 0 ? (
                <p className="px-4 text-xs text-gray-600 mt-2">No hay playlists.</p>
            ) : (
                userPlaylists.map(pl => (
                <a key={pl.id} href={`/playlists`} className="flex items-center gap-3 px-4 py-2.5 text-gray-400 hover:text-white hover:bg-[#1e1f22]/50 rounded-lg text-sm transition truncate">
                    📁 {pl.name}
                </a>
                ))
            )}
            </div>

            <div className="px-6 flex items-center gap-4 mt-auto border-t border-[#1e1f22] pt-6 mb-2">
            <img src={session.user.image} className="w-10 h-10 rounded-full border border-[#2b2d31]" alt="Avatar" />
            <div className="flex flex-col min-w-0">
                <span className="text-sm font-bold truncate text-gray-200">{session.user.name}</span>
                <a href="/api/auth/signout" className="text-[10px] text-gray-500 hover:text-white font-bold uppercase tracking-wider transition">Cerrar Sesión</a>
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