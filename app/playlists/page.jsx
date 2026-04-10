import { getServerSession } from "next-auth/next";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { Pool } from 'pg';
import Link from "next/link";
import SidebarFavorites from "../../components/SidebarFavorites";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// 🔥 COMPONENTE MAGICO: Generador de Mosaicos 2x2 🔥
const MosaicCover = ({ songs }) => {
  if (!songs || songs.length === 0) {
    return (
      <div className="w-full aspect-square bg-[#1e1f22] flex items-center justify-center text-gray-600">
        <svg className="w-12 h-12 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
        </svg>
      </div>
    );
  }

  // Filtramos para obtener portadas ÚNICAS (para que no se repita 4 veces la misma si agregaste el mismo disco)
  const uniqueCovers = [];
  const seenIds = new Set();
  for (const song of songs) {
    if (!seenIds.has(song.videoId) && song.thumbnail) {
      seenIds.add(song.videoId);
      uniqueCovers.push(song.thumbnail);
    }
  }

  // Si hay menos de 4 portadas distintas, mostramos la primera en grande
  if (uniqueCovers.length < 4) {
    return (
      <img 
        src={uniqueCovers[0]} 
        alt="Cover" 
        className="w-full aspect-square object-cover shadow-md"
      />
    );
  }

  // Si hay 4 o más, armamos el mosaico estilo Spotify
  return (
    <div className="w-full aspect-square grid grid-cols-2 grid-rows-2 gap-0 shadow-md">
      <img src={uniqueCovers[0]} className="w-full h-full object-cover" alt="Cover 1" />
      <img src={uniqueCovers[1]} className="w-full h-full object-cover" alt="Cover 2" />
      <img src={uniqueCovers[2]} className="w-full h-full object-cover" alt="Cover 3" />
      <img src={uniqueCovers[3]} className="w-full h-full object-cover" alt="Cover 4" />
    </div>
  );
};

export default async function PlaylistsPage() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) redirect('/login');

  let playlists = [];
  let allLikes = [];

  try {
    // Traemos las playlists con todo su contenido (JSONB)
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
      
      {/* SIDEBAR (Idéntica al Dashboard para mantener la estética) */}
      <aside className="w-[280px] bg-[#000000] border-r border-[#1e1f22] flex flex-col pt-8 pb-8 z-10 shadow-xl shrink-0">
        <div className="px-4 flex flex-col gap-2 mb-8">
          <div className="px-4 py-1 text-[10px] font-black uppercase text-gray-600 tracking-widest mb-2">Navegación</div>
          <Link href="/dashboard/select" className="flex items-center gap-3 px-4 py-2.5 text-gray-400 hover:text-white hover:bg-[#1e1f22]/50 rounded-lg font-bold text-sm transition">
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

        {/* Listado lateral estilo Spotify */}
        <div className="px-4 mt-6 flex flex-col gap-1 flex-1 overflow-y-auto custom-scrollbar">
          <div className="px-4 py-1 text-[10px] font-black uppercase text-gray-600 tracking-widest mb-2">
            Tu Biblioteca
          </div>
          {playlists.map(pl => (
            <Link key={pl.id} href={`/playlists/${pl.id}`} className="flex items-center gap-3 px-4 py-2.5 text-gray-400 hover:text-white hover:bg-[#1e1f22]/50 rounded-lg text-sm transition truncate">
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

      {/* CONTENIDO CENTRAL: Grilla de Playlists */}
      <section className="flex-1 flex flex-col overflow-y-auto custom-scrollbar bg-gradient-to-b from-[#18191c] to-[#0a0a0c]">
        <div className="p-8 md:p-12 max-w-[1600px] w-full mx-auto">
          
          <h1 className="text-4xl font-black tracking-tight mb-8">Tus Playlists</h1>

          {playlists.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[50vh] text-center opacity-50">
              <svg className="w-20 h-20 mb-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <h2 className="text-2xl font-bold">Aún no tienes playlists</h2>
              <p className="text-sm mt-2 max-w-md">Guarda la cola de reproducción actual desde tu Dashboard o usando el comando /playlist en Discord para crear una nueva.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              
              {/* Tarjeta para crear nueva (opcional, visual por ahora) */}
              <div className="bg-[#111214] hover:bg-[#1e1f22] p-4 rounded-xl border border-transparent hover:border-[#2b2d31] transition-all cursor-pointer group flex flex-col items-center justify-center aspect-[3/4]">
                 <div className="w-16 h-16 rounded-full bg-[#2b2d31] flex items-center justify-center text-gray-400 group-hover:text-white transition-colors mb-4">
                    <span className="text-3xl leading-none font-light">+</span>
                 </div>
                 <span className="font-bold text-gray-300 group-hover:text-white transition-colors">Crear Playlist</span>
              </div>

              {/* Mapeo de las Playlists Reales */}
              {playlists.map(pl => (
                <Link href={`/playlists/${pl.id}`} key={pl.id} className="bg-[#111214] hover:bg-[#1e1f22] p-4 rounded-xl border border-transparent hover:border-[#2b2d31] transition-all group flex flex-col">
                  
                  {/* Contenedor de la imagen con botón de Play invisible estilo Spotify */}
                  <div className="relative mb-4 rounded-md overflow-hidden shadow-lg aspect-square">
                    <MosaicCover songs={pl.songs} />
                    
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 flex items-end justify-end p-3">
                        <button className="w-12 h-12 bg-[#57F287] rounded-full flex items-center justify-center text-black opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 hover:scale-105 hover:bg-[#45d16f] shadow-xl">
                            <svg className="w-6 h-6 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                        </button>
                    </div>
                  </div>

                  <h3 className="font-bold text-white text-base truncate mb-1">{pl.name}</h3>
                  <p className="text-xs text-gray-500 font-medium truncate">
                    {pl.songs.length} pistas • {pl.songs.length > 0 ? pl.songs[0].artist : 'Vacía'}
                  </p>
                </Link>
              ))}
            </div>
          )}

        </div>
      </section>
    </main>
  );
}