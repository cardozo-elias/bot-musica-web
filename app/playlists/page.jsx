import { getServerSession } from "next-auth/next";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { Pool } from 'pg';
import Link from "next/link";
import SidebarFavorites from "../../components/SidebarFavorites";
import PlaylistsContent from "./PlaylistsContent"; // Importamos el nuevo componente

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export default async function PlaylistsPage() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) redirect('/login');

  let playlists = [];
  let allLikes = [];

  try {
    // Traemos las playlists
    const plRes = await pool.query('SELECT id, name, songs FROM user_playlists WHERE user_id = $1 ORDER BY id DESC', [session.user.id]);
    playlists = plRes.rows.map(pl => ({
      id: pl.id,
      name: pl.name,
      songs: typeof pl.songs === 'string' ? JSON.parse(pl.songs) : pl.songs || []
    }));

    // Traemos los likes para la sidebar
    const likesRes = await pool.query('SELECT title, artist, video_id as "videoId" FROM likes WHERE user_id = $1 ORDER BY id DESC LIMIT 50', [session.user.id]);
    allLikes = likesRes.rows;
  } catch (e) {
    console.error("[PLAYLISTS DB ERROR]:", e.message);
  }

  return (
    <main className="h-screen bg-[#0a0a0c] text-white flex overflow-hidden font-sans">
      
      {/* SIDEBAR */}
      <aside className="w-[280px] bg-[#000000] border-r border-[#1e1f22] flex flex-col pt-8 pb-8 z-10 shadow-xl shrink-0">
        <div className="px-4 flex flex-col gap-2 mb-8">
          <div className="px-4 py-1 text-[10px] font-black uppercase text-gray-600 tracking-widest mb-2">Navegación</div>
          <Link href={`/dashboard/${session.user.id}`} className="flex items-center gap-3 px-4 py-2.5 text-gray-400 hover:text-white hover:bg-[#1e1f22]/50 rounded-lg font-bold text-sm transition">
             Panel Principal
          </Link>
          <div className="flex items-center gap-3 px-4 py-2.5 bg-[#1e1f22] text-white rounded-lg font-bold text-sm transition mt-1">
             Tus Playlists
          </div>
        </div>

        <SidebarFavorites 
          initialLikes={allLikes} 
          userId={session.user.id} 
          userName={session.user.name} 
          userAvatar={session.user.image} 
        />

        <div className="px-6 flex items-center gap-4 mt-auto border-t border-[#1e1f22] pt-6">
          <img src={session.user.image} className="w-10 h-10 rounded-full border border-[#2b2d31]" alt="Avatar" />
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-bold truncate text-gray-200">{session.user.name}</span>
            <a href="/api/auth/signout" className="text-[10px] text-gray-500 hover:text-white font-bold uppercase tracking-wider transition">Cerrar Sesión</a>
          </div>
        </div>
      </aside>

      {/* AQUI INYECTAMOS EL COMPONENTE INTERACTIVO */}
      <PlaylistsContent initialPlaylists={playlists} />

    </main>
  );
}