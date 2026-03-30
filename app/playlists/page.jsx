"use client";
import { useEffect, useState } from "react";
import LivePlayer from "../../components/LivePlayer";
import { io } from "socket.io-client";

export default function PlaylistsPage() {
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [sessionInfo, setSessionInfo] = useState(null);

  useEffect(() => {
    fetch("/api/auth/session").then(res => res.json()).then(setSessionInfo);
    fetchPlaylists();
  }, []);

  const fetchPlaylists = async () => {
    try {
      const res = await fetch("/api/playlists"); 
      const data = await res.json();
      setPlaylists(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const removeSong = async (playlistId, videoId) => {
    await fetch("/api/playlists", { 
      method: "PATCH", 
      headers: { "Content-Type": "application/json" }, 
      body: JSON.stringify({ playlistId, videoId }) 
    });
    fetchPlaylists();
  };

  const deletePlaylist = async (id) => {
    if (!confirm("¿Seguro que quieres eliminar esta playlist entera?")) return;
    await fetch(`/api/playlists?id=${id}`, { method: "DELETE" });
    fetchPlaylists();
  };

  const handlePlayPlaylist = (playlistId, e) => {
    e.stopPropagation();
    if (!sessionInfo?.user) return;
    const socket = io("http://localhost:3001");
    socket.emit("cmd_play_playlist", { 
        userId: sessionInfo.user.id, 
        playlistId: playlistId, 
        userName: sessionInfo.user.name, 
        userAvatar: sessionInfo.user.image 
    });
    alert("🎶 ¡Playlist enviada a la cola!");
    setTimeout(() => socket.disconnect(), 1000);
  };

  return (
    <main className="min-h-screen bg-[#0a0a0c] text-white p-6 md:p-12 pb-48">
      <div className="max-w-[1200px] mx-auto">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 border-b border-[#2b2d31] pb-8 gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-[#5865F2] to-[#57F287]">
              Tus playlists
            </h1>
            <p className="text-gray-500 font-bold uppercase text-[10px] tracking-[0.3em] mt-2">Colección de listas personalizadas</p>
          </div>
          <a href="/" className="bg-[#111214] border border-[#2b2d31] hover:bg-white hover:text-black px-8 py-3 rounded-full font-black text-xs uppercase tracking-widest transition shadow-lg">
            Volver al Panel
          </a>
        </div>

        {/* LISTA DE PLAYLISTS */}
        {loading ? (
          <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#5865F2]"></div></div>
        ) : playlists.length === 0 ? (
          <div className="bg-[#111214] p-20 rounded-3xl border border-dashed border-[#2b2d31] text-center shadow-2xl">
            <p className="text-gray-400 font-bold text-xl mb-2">Aún no tienes listas de reproducción.</p>
            <p className="text-gray-600 text-sm">Usa el buscador en el panel principal para crear una.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {playlists.map(pl => (
              <div key={pl.id} className="bg-[#111214] rounded-3xl border border-[#2b2d31] overflow-hidden shadow-2xl transition hover:border-[#3f4147]">
                
                {/* CABECERA PLAYLIST */}
                <div className="p-6 md:p-8 flex flex-col md:flex-row justify-between items-center cursor-pointer hover:bg-[#1a1b1e] gap-6" onClick={() => setExpandedId(expandedId === pl.id ? null : pl.id)}>
                  <div className="flex items-center gap-6 w-full">
                    <div className="bg-gradient-to-br from-[#5865F2] to-[#57F287] p-5 rounded-2xl shadow-xl text-white">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>
                    </div>
                    <div>
                      <h2 className="text-2xl font-black tracking-tight">{pl.name}</h2>
                      <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mt-1">{pl.songs?.length || 0} canciones guardadas</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3 w-full md:w-auto">
                    <button onClick={(e) => handlePlayPlaylist(pl.id, e)} disabled={!pl.songs?.length} className="flex-1 md:flex-none bg-[#57F287] text-black px-8 py-3 rounded-full font-black text-xs uppercase hover:scale-105 transition shadow-xl disabled:opacity-30">
                      Reproducir
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); deletePlaylist(pl.id); }} className="bg-[#da373c]/10 text-[#da373c] border border-[#da373c]/20 hover:bg-[#da373c] hover:text-white p-3 rounded-full transition" title="Eliminar Lista">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </div>

                {/* CANCIONES DESPLEGADAS */}
                {expandedId === pl.id && (
                  <div className="p-4 md:p-8 bg-[#0a0a0c] border-t border-[#2b2d31] flex flex-col gap-2">
                    {pl.songs?.map((song, i) => (
                      <div key={i} className="flex justify-between items-center p-3 md:p-4 hover:bg-[#1e1f22] rounded-2xl group transition border border-transparent hover:border-[#2b2d31]">
                        <div className="flex items-center gap-5 overflow-hidden">
                          <span className="text-gray-600 font-black text-xs w-4 text-center">{i + 1}</span>
                          <img src={song.thumbnail} className="w-12 h-12 rounded-xl shadow-md object-cover" alt="" />
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-white truncate">{song.title}</p>
                            <p className="text-[10px] text-gray-500 uppercase font-black tracking-wider mt-0.5">{String(song.artist)}</p>
                          </div>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); removeSong(pl.id, song.videoId); }} className="opacity-0 group-hover:opacity-100 text-red-500 p-2 rounded-lg hover:bg-[#111214] transition font-bold text-xs uppercase tracking-widest">
                           Quitar
                        </button>
                      </div>
                    ))}
                    {(!pl.songs || pl.songs.length === 0) && (
                        <p className="text-center py-6 text-gray-600 font-bold text-sm">Esta lista está vacía.</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      {sessionInfo?.user?.id && <LivePlayer userId={sessionInfo.user.id} />}
    </main>
  );
}