import { getServerSession } from "next-auth/next";
import { authOptions } from "../../api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { Pool } from 'pg';

import LivePlayer from "../../../components/LivePlayer";
import WebSearch from "../../../components/WebSearch";
import Recommendations from "../../../components/Recommendations";
import ServerSelector from "../../../components/ServerSelector";
import RecentlyPlayed from "../../../components/RecentlyPlayed";
import SidebarFavorites from "../../../components/SidebarFavorites"; // IMPORTAMOS EL NUEVO DESPLEGABLE

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
      stats.listenTimeHours = Math.floor(userStatsRes.rows[0].listen_time / 3600);
      stats.songsPlayed = userStatsRes.rows[0].songs_played;
    }

    // Likes para el panel lateral
    const recentLikesRes = await pool.query('SELECT title, artist, video_id as "videoId" FROM likes WHERE user_id = $1 ORDER BY id DESC LIMIT 50', [session.user.id]);
    allLikes = recentLikesRes.rows;

    const plRes = await pool.query('SELECT id, name FROM user_playlists WHERE user_id = $1', [session.user.id]);
    userPlaylists = plRes.rows;

    // Historial Reciente (Evitamos errores si la tabla recién se crea)
    try {
      const historyRes = await pool.query('SELECT title, artist, video_id as "videoId", played_at as "playedAt" FROM user_history WHERE user_id = $1 ORDER BY played_at DESC LIMIT 30', [session.user.id]);
      userHistory = historyRes.rows;
    } catch(err) { console.log("La tabla history aún no tiene datos o no existe."); }

  } catch (e) {
    console.error("[WEB DB ERROR]:", e.message);
  }

  return (
    <main className="h-screen bg-[#0a0a0c] text-white flex overflow-hidden font-sans">
      
      {/* SIDEBAR NUEVO DISEÑO */}
      <aside className="w-[280px] bg-[#000000] border-r border-[#1e1f22] flex flex-col pt-8 pb-28 z-10 shadow-xl">
        
        {/* Navegación Principal */}
        <div className="px-4 flex flex-col gap-2 mb-8">
          <div className="px-4 py-1 text-[10px] font-black uppercase text-gray-600 tracking-widest mb-2">Navegación</div>
          <button className="flex items-center gap-3 px-4 py-2.5 bg-[#1e1f22] text-white rounded-lg font-bold text-sm transition">
            Panel Principal
          </button>
          
          <div className="mt-1">
            <ServerSelector userId={session.user.id} currentGuildId={guildId} />
          </div>
        </div>

        {/* LIKES DESPLEGABLES (REEMPLAZO TOTAL) */}
        <SidebarFavorites initialLikes={allLikes} userId={session.user.id} userName={session.user.name} userAvatar={session.user.image} />

        {/* Listado de Playlists */}
        <div className="px-4 flex flex-col gap-1 flex-1 overflow-y-auto custom-scrollbar mt-4">
          <div className="px-4 py-1 text-[10px] font-black uppercase text-gray-600 tracking-widest mb-2 flex justify-between items-center">
            Playlists
            <a href="/playlists" className="text-lg leading-none cursor-pointer text-gray-500 hover:text-white transition" title="Gestionar Playlists">+</a>
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

        {/* PERFIL DE USUARIO (MOVIDO AL FONDO) */}
        <div className="px-6 flex items-center gap-4 mt-auto border-t border-[#1e1f22] pt-6 mb-2">
          <img src={session.user.image} className="w-10 h-10 rounded-full border border-[#2b2d31]" alt="Avatar" />
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-bold truncate text-gray-200">{session.user.name}</span>
            <a href="/signout" className="text-[10px] text-gray-500 hover:text-white font-bold uppercase tracking-wider transition">Cerrar Sesión</a>
          </div>
        </div>

      </aside>

      {/* CONTENIDO CENTRAL */}
      <section className="flex-1 flex flex-col overflow-y-auto custom-scrollbar bg-[#0a0a0c] pb-32">
        <div className="p-6 md:p-10 max-w-[1400px] w-full mx-auto flex flex-col gap-10">
          
          {/* Header de Estadísticas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-[#111214] p-6 rounded-2xl border border-[#1e1f22] flex flex-col shadow-sm">
                  <span className="text-gray-500 text-[10px] uppercase font-bold tracking-widest mb-2">Pistas Guardadas</span>
                  <span className="text-3xl font-black text-white">{stats.likesCount}</span>
              </div>
              <div className="bg-[#111214] p-6 rounded-2xl border border-[#1e1f22] flex flex-col shadow-sm">
                  <span className="text-gray-500 text-[10px] uppercase font-bold tracking-widest mb-2">Horas Escuchadas</span>
                  <span className="text-3xl font-black text-white">{stats.listenTimeHours}h</span>
              </div>
              <div className="bg-[#111214] p-6 rounded-2xl border border-[#1e1f22] flex flex-col shadow-sm">
                  <span className="text-gray-500 text-[10px] uppercase font-bold tracking-widest mb-2">Solicitadas</span>
                  <span className="text-3xl font-black text-white">{stats.songsPlayed}</span>
              </div>
          </div>

          <div className="w-full">
            <WebSearch userId={session.user.id} userName={session.user.name} userAvatar={session.user.image} guildId={guildId} />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            <div className="w-full">
              <RecentlyPlayed history={userHistory} userId={session.user.id} userName={session.user.name} userAvatar={session.user.image} />
            </div>

            <div className="w-full">
              <Recommendations userId={session.user.id} userName={session.user.name} userAvatar={session.user.image} />
            </div>
          </div>

        </div>
      </section>

      <LivePlayer userId={session.user.id} guildId={guildId} />
    </main>
  );
}