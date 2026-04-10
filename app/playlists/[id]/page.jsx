import { getServerSession } from "next-auth/next";
import { authOptions } from "../../api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { Pool } from 'pg';
import Link from "next/link";
import SidebarFavorites from "../../../components/SidebarFavorites";
import PlaylistDetailClient from "./PlaylistDetailClient";
import { SocketProvider } from "../../../components/SocketContext";
import LivePlayer from "../../../components/LivePlayer";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export default async function PlaylistPage({ params }) {
  const resolvedParams = await params;
  const playlistId = resolvedParams?.id;
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) redirect('/login');

  let playlist = null;
  let allLikes = [];
  let userPlaylists = [];
  let isOwner = false;

  try {
    // Buscamos la playlist sin importar de quién sea todavía
    const plRes = await pool.query('SELECT * FROM user_playlists WHERE id = $1', [playlistId]);
    if (plRes.rows.length === 0) redirect('/playlists');

    const plData = plRes.rows[0];
    isOwner = plData.user_id === session.user.id;

    // 🔥 EL PORTERO: Si no es el dueño y tampoco es pública, ¡pa' fuera! 🔥
    if (!isOwner && !plData.is_public) {
        redirect('/playlists');
    }

    playlist = {
      id: plData.id,
      name: plData.name,
      is_public: plData.is_public || false,
      owner_id: plData.user_id,
      songs: typeof plData.songs === 'string' ? JSON.parse(plData.songs) : plData.songs || []
    };

    // Traemos datos para la barra lateral (de la sesión actual)
    const likesRes = await pool.query('SELECT title, artist, video_id as "videoId" FROM likes WHERE user_id = $1 ORDER BY id DESC LIMIT 50', [session.user.id]);
    allLikes = likesRes.rows;

    const allPlRes = await pool.query('SELECT id, name FROM user_playlists WHERE user_id = $1 ORDER BY id DESC', [session.user.id]);
    userPlaylists = allPlRes.rows;

  } catch (e) {
    console.error("[PLAYLIST DB ERROR]:", e.message);
    redirect('/playlists');
  }

  return (
    <SocketProvider>
      <main className="h-screen bg-[#0a0a0c] text-white flex overflow-hidden font-sans">
        
        <aside className="w-[280px] bg-[#000000] border-r border-[#1e1f22] flex flex-col pt-8 pb-8 z-10 shadow-xl shrink-0 hidden md:flex">
          <div className="px-4 flex flex-col gap-2 mb-8">
            <div className="px-4 py-1 text-[10px] font-black uppercase text-gray-600 tracking-widest mb-2">Navegación</div>
            <Link href={`/dashboard/${session.user.id}`} className="flex items-center gap-3 px-4 py-2.5 text-gray-400 hover:text-white hover:bg-[#1e1f22]/50 rounded-lg font-bold text-sm transition">
               Panel Principal
            </Link>
            <Link href="/playlists" className="flex items-center gap-3 px-4 py-2.5 text-gray-400 hover:text-white hover:bg-[#1e1f22]/50 rounded-lg font-bold text-sm transition mt-1">
               Tus Playlists
            </Link>
          </div>

          <SidebarFavorites initialLikes={allLikes} userId={session.user.id} userName={session.user.name} userAvatar={session.user.image} />

          <div className="px-4 mt-6 flex flex-col gap-1 flex-1 overflow-y-auto custom-scrollbar">
            <div className="px-4 py-1 text-[10px] font-black uppercase text-gray-600 tracking-widest mb-2">Tu Biblioteca</div>
            {userPlaylists.map(pl => (
              <Link key={pl.id} href={`/playlists/${pl.id}`} className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition truncate ${pl.id == playlistId ? 'bg-[#1e1f22] text-white font-bold' : 'text-gray-400 hover:text-white hover:bg-[#1e1f22]/50'}`}>
                {pl.name}
              </Link>
            ))}
          </div>

          <div className="px-6 flex items-center gap-4 mt-auto border-t border-[#1e1f22] pt-6">
            <img src={session.user.image} className="w-10 h-10 rounded-full border border-[#2b2d31]" alt="Avatar" />
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold truncate text-gray-200">{session.user.name}</span>
              <a href="/api/auth/signout" className="text-[10px] text-gray-500 hover:text-white font-bold uppercase tracking-wider transition">Cerrar Sesión</a>
            </div>
          </div>
        </aside>

        {/* Le pasamos isOwner al cliente para que oculte los botones de borrar si eres visitante */}
        <PlaylistDetailClient playlist={playlist} session={session} isOwner={isOwner} />

        <LivePlayer userId={session.user.id} />

      </main>
    </SocketProvider>
  );
}