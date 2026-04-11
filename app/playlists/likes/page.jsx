import { getServerSession } from "next-auth/next";
import { authOptions } from "../../api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { Pool } from 'pg';
import Link from "next/link";
import PlaylistDetailClient from "../[id]/PlaylistDetailClient";
import { SocketProvider } from "../../../components/SocketContext";
import LivePlayer from "../../../components/LivePlayer";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export default async function LikesPlaylistPage() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) redirect('/login');

  let likedSongs = [];
  let userPlaylists = [];

  try {
    // 1. Obtenemos las canciones que le gustaron al usuario
    const likesRes = await pool.query(
      'SELECT title, artist, video_id as "videoId" FROM likes WHERE user_id = $1 ORDER BY id DESC',
      [session.user.id]
    );

    // Formateamos para que el cliente lo entienda como si fuera una playlist normal
    likedSongs = likesRes.rows.map(row => ({
      title: row.title,
      artist: row.artist,
      videoId: row.videoId,
      thumbnail: `https://img.youtube.com/vi/${row.videoId}/hqdefault.jpg`, // Usamos la miniatura de YouTube
      requester: session.user.name,
      requesterAvatar: session.user.image,
      url: `https://www.youtube.com/watch?v=${row.videoId}`
    }));

    // 2. Obtenemos las playlists reales para renderizar el menú lateral
    const allPlRes = await pool.query(
      'SELECT id, name FROM user_playlists WHERE user_id = $1 ORDER BY id DESC',
      [session.user.id]
    );
    userPlaylists = allPlRes.rows;

  } catch (e) {
    console.error("[LIKES DB ERROR]:", e.message);
  }

  // 🔥 LA MAGIA: Creamos un objeto playlist "falso" (virtual) 🔥
  const pseudoPlaylist = {
    id: "likes",
    name: "Tus Me Gusta",
    is_public: false,
    songs: likedSongs
  };

  return (
    <SocketProvider>
      <main className="h-screen bg-transparent text-white flex overflow-hidden font-sans">
        
        {/* SIDEBAR CON GLASSMORPHISM (Igual al del Dashboard) */}
        <aside className="w-[280px] bg-[#0a0a0c]/80 backdrop-blur-xl border-r border-[#1e1f22] flex flex-col pt-8 pb-28 z-10 shadow-[4px_0_24px_rgba(0,0,0,0.5)] shrink-0 hidden md:flex">
          <div className="px-4 flex flex-col gap-2 mb-8">
            <div className="px-4 py-1 text-[10px] font-black uppercase text-gray-500 tracking-widest mb-2">Navegación</div>
            <Link href={`/dashboard/${session.user.id}`} className="flex items-center gap-3 px-4 py-2.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg font-bold text-sm transition">
               Panel Principal
            </Link>
            <Link href="/playlists" className="flex items-center gap-3 px-4 py-2.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg font-bold text-sm transition mt-1">
               Tus Playlists
            </Link>
          </div>

          <div className="px-4 flex flex-col gap-1 flex-1 overflow-y-auto custom-scrollbar">
            <div className="px-4 py-1 text-[10px] font-black uppercase text-gray-500 tracking-widest mb-2">Tu Biblioteca</div>
            
            {/* Botón Activo de Likes (Gradiente Rosado) */}
            <Link href="/playlists/likes" className="flex items-center gap-3 px-4 py-2.5 bg-gradient-to-r from-[#a855f7]/20 to-[#ec4899]/20 text-white rounded-lg text-sm transition font-bold border border-[#ec4899]/30 shadow-inner">
              ❤️ Tus Me Gusta
            </Link>

            {userPlaylists.map(pl => (
              <Link key={pl.id} href={`/playlists/${pl.id}`} className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition truncate text-gray-400 hover:text-[#ec4899] hover:bg-white/5 font-medium">
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

        {/* Renderizamos el cliente que hicimos en el paso anterior */}
        <PlaylistDetailClient 
            playlist={pseudoPlaylist} 
            session={session} 
            isOwner={true} 
            isLikesPlaylist={true} 
        />

        <LivePlayer userId={session.user.id} />

      </main>
    </SocketProvider>
  );
}