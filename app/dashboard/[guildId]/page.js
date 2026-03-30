import { getServerSession } from "next-auth/next";
import { authOptions } from "../../api/auth/[...nextauth]/route"; // Ajusté la ruta por la nueva carpeta
import { redirect } from "next/navigation";
import { Pool } from 'pg';

import LivePlayer from "../../../components/LivePlayer";
import WebSearch from "../../../components/WebSearch";
import Recommendations from "../../../components/Recommendations";
import FavoritesList from "../../../components/FavoritesList";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// En Next.js, los componentes de página reciben 'params' automáticamente
export default async function DashboardPage({ params }) {
  const { guildId } = await params; // Capturamos el ID del servidor de la URL
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    redirect('/login');
  }
  
  let stats = { likesCount: 0, listenTimeHours: 0, songsPlayed: 0 };
  let allLikes = [];
  
  try {
    const likesRes = await pool.query('SELECT COUNT(*) FROM likes WHERE user_id = $1', [session.user.id]);
    stats.likesCount = likesRes.rows[0].count;

    const userStatsRes = await pool.query('SELECT listen_time, songs_played FROM user_stats WHERE user_id = $1', [session.user.id]);
    if (userStatsRes.rows.length > 0) {
      stats.listenTimeHours = Math.floor(userStatsRes.rows[0].listen_time / 3600);
      stats.songsPlayed = userStatsRes.rows[0].songs_played;
    }

    const recentRes = await pool.query('SELECT title, artist, video_id as "videoId" FROM likes WHERE user_id = $1 ORDER BY id DESC', [session.user.id]);
    allLikes = recentRes.rows;

  } catch (e) {
    console.error("[WEB DB ERROR]:", e.message);
  }

  return (
    <main className="min-h-screen bg-[#0a0a0c] text-white p-4 md:p-8 pb-40 relative">
      
      <a href="/" className="absolute top-6 left-6 md:top-8 md:left-8 text-gray-500 hover:text-[#5865F2] hover:scale-110 transition z-50 bg-[#111214] p-3 rounded-full border border-[#2b2d31] shadow-lg" title="Volver al Inicio">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      </a>

      <div className="max-w-[1800px] mx-auto grid grid-cols-1 lg:grid-cols-[320px_1fr_400px] gap-8 pt-16 md:pt-0">
        
        <aside className="lg:sticky lg:top-4 h-fit">
          <div className="bg-[#111214] p-6 rounded-3xl border border-[#2b2d31] mb-6 flex flex-col items-center shadow-xl relative overflow-hidden">
              <div className="absolute top-0 w-full h-24 bg-gradient-to-b from-[#5865F2]/20 to-transparent"></div>
              <img src={session.user.image} className="w-20 h-20 rounded-full border-4 border-[#2b2d31] mb-4 relative z-10 shadow-lg" alt="Avatar" />
              <h2 className="font-black text-xl text-center tracking-tight">¡Hola, {session.user.name}!</h2>
              <div className="flex gap-2 mt-6 w-full relative z-10">
                  <a href="/playlists" className="flex-1 bg-[#5865F2] text-center py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#4752C4] transition shadow-lg shadow-[#5865F2]/20">Playlists</a>
                  <a href="/signout" className="flex-1 bg-[#da373c]/10 text-[#da373c] text-center py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border border-[#da373c]/20 hover:bg-[#da373c]/20 transition">Salir</a>
              </div>
          </div>
          <Recommendations userId={session.user.id} userName={session.user.name} userAvatar={session.user.image} />
        </aside>

        <section className="flex flex-col gap-6">
          <div className="grid grid-cols-3 gap-4">
              <div className="bg-[#111214] p-6 rounded-3xl border border-[#2b2d31] text-center shadow-lg relative overflow-hidden group hover:border-[#57F287] transition">
                  <div className="absolute inset-0 bg-[#57F287]/5 opacity-0 group-hover:opacity-100 transition"></div>
                  <p className="text-gray-500 text-[10px] uppercase font-black mb-1 tracking-widest relative z-10">Likes</p>
                  <p className="text-3xl font-black text-[#57F287] relative z-10">{stats.likesCount}</p>
              </div>
              <div className="bg-[#111214] p-6 rounded-3xl border border-[#2b2d31] text-center shadow-lg relative overflow-hidden group hover:border-[#FEE75C] transition">
                  <div className="absolute inset-0 bg-[#FEE75C]/5 opacity-0 group-hover:opacity-100 transition"></div>
                  <p className="text-gray-500 text-[10px] uppercase font-black mb-1 tracking-widest relative z-10">Horas</p>
                  <p className="text-3xl font-black text-[#FEE75C] relative z-10">{stats.listenTimeHours}h</p>
              </div>
              <div className="bg-[#111214] p-6 rounded-3xl border border-[#2b2d31] text-center shadow-lg relative overflow-hidden group hover:border-[#EB459E] transition">
                  <div className="absolute inset-0 bg-[#EB459E]/5 opacity-0 group-hover:opacity-100 transition"></div>
                  <p className="text-gray-500 text-[10px] uppercase font-black mb-1 tracking-widest relative z-10">Solicitadas</p>
                  <p className="text-3xl font-black text-[#EB459E] relative z-10">{stats.songsPlayed}</p>
              </div>
          </div>
          
          <WebSearch userId={session.user.id} userName={session.user.name} userAvatar={session.user.image} guildId={guildId} />
          
          <FavoritesList likes={allLikes} userId={session.user.id} userName={session.user.name} userAvatar={session.user.image} />
        </section>

        <aside className="hidden lg:block h-screen">
          {/* Espacio para la cola flotante si es necesario */}
        </aside>
      </div>
      
      {/* Pasamos la guildId al reproductor */}
      <LivePlayer userId={session.user.id} guildId={guildId} />
    </main>
  );
}