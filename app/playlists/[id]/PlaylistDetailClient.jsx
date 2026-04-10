"use client";
import React, { useState, useEffect } from 'react';
import { io } from "socket.io-client";

// Reutilizamos el creador de Mosaicos
const MosaicCoverLarge = ({ songs }) => {
  if (!songs || songs.length === 0) {
    return <div className="w-48 h-48 md:w-60 md:h-60 bg-[#1e1f22] shadow-2xl flex items-center justify-center"><span className="text-4xl text-gray-600">🎵</span></div>;
  }
  const uniqueCovers = []; const seenIds = new Set();
  for (const song of songs) { if (!seenIds.has(song.videoId) && song.thumbnail) { seenIds.add(song.videoId); uniqueCovers.push(song.thumbnail); } }
  
  if (uniqueCovers.length < 4) return <img src={uniqueCovers[0]} alt="Cover" className="w-48 h-48 md:w-60 md:h-60 object-cover shadow-2xl" />;
  
  return (
    <div className="w-48 h-48 md:w-60 md:h-60 grid grid-cols-2 grid-rows-2 shadow-2xl">
      <img src={uniqueCovers[0]} className="w-full h-full object-cover" alt="Cover 1" />
      <img src={uniqueCovers[1]} className="w-full h-full object-cover" alt="Cover 2" />
      <img src={uniqueCovers[2]} className="w-full h-full object-cover" alt="Cover 3" />
      <img src={uniqueCovers[3]} className="w-full h-full object-cover" alt="Cover 4" />
    </div>
  );
};

export default function PlaylistDetailClient({ playlist, session }) {
  const [songs, setSongs] = useState(playlist.songs || []);
  const [isRemoving, setIsRemoving] = useState(null);
  const [socket, setSocket] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const botUrl = process.env.NEXT_PUBLIC_BOT_URL || "http://localhost:3001";
    const newSocket = io(botUrl, { extraHeaders: { "ngrok-skip-browser-warning": "true" } });
    setSocket(newSocket);
    return () => newSocket.disconnect();
  }, []);

  const handlePlayPlaylist = () => {
    if (!socket || songs.length === 0) return;
    setIsPlaying(true);
    socket.emit("cmd_play_playlist", {
      userId: session.user.id,
      playlistId: playlist.id,
      userName: session.user.name,
      userAvatar: session.user.image
    });
    setTimeout(() => setIsPlaying(false), 2000); // Efecto visual
  };

  const handleRemoveSong = async (videoId) => {
    setIsRemoving(videoId);
    try {
      const res = await fetch('/api/playlists', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playlistId: playlist.id, videoId })
      });
      if (res.ok) setSongs(songs.filter(s => s.videoId !== videoId));
    } catch (e) { console.error(e); }
    setIsRemoving(null);
  };

  // Calcular duración total (Asumiendo que las canciones tienen 'durationSec' o estimando)
  // Como tu base de datos guarda 'url' y 'thumbnail' pero quizás no los segundos exactos, ponemos un placeholder o calculamos si existen.
  const totalDuration = songs.length > 0 ? `${Math.floor((songs.length * 3.5))} min aprox` : "0 min";

  return (
    <section className="flex-1 flex flex-col overflow-y-auto custom-scrollbar bg-[#111214]">
      
      {/* HERO SECTION ESTILO SPOTIFY */}
      <div className="relative pt-20 pb-8 px-8 md:px-12 flex flex-col md:flex-row items-end gap-6 bg-gradient-to-b from-[#2b2d31] to-[#111214]">
        <MosaicCoverLarge songs={songs} />
        <div className="flex flex-col mb-2">
          <span className="text-xs font-black uppercase tracking-widest text-gray-200 drop-shadow-md">Playlist Pública</span>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter mt-2 mb-4 drop-shadow-lg">{playlist.name}</h1>
          <div className="flex items-center gap-2 text-sm font-medium text-gray-300 drop-shadow-md">
            <img src={session.user.image} className="w-6 h-6 rounded-full" alt="User" />
            <span className="font-bold text-white hover:underline cursor-pointer">{session.user.name}</span>
            <span>•</span>
            <span>{songs.length} pistas</span>
            <span>•</span>
            <span>{totalDuration}</span>
          </div>
        </div>
      </div>

      {/* CONTROLES (BOTÓN PLAY) */}
      <div className="px-8 md:px-12 py-6 flex items-center gap-6">
        <button 
          onClick={handlePlayPlaylist}
          disabled={songs.length === 0}
          className={`w-16 h-16 flex items-center justify-center rounded-full transition-all duration-300 shadow-xl transform hover:scale-105 ${isPlaying ? 'bg-[#45d16f] scale-95' : 'bg-[#57F287] hover:bg-[#45d16f]'} ${songs.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <svg className="w-8 h-8 text-black ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
        </button>
      </div>

      {/* TABLA DE CANCIONES */}
      <div className="px-8 md:px-12 pb-20">
        <div className="grid grid-cols-[auto_1fr_auto] md:grid-cols-[auto_1fr_1fr_auto] gap-4 px-4 py-2 border-b border-[#2b2d31] text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
          <span className="w-8 text-center">#</span>
          <span>Título</span>
          <span className="hidden md:block">Añadido por</span>
          <span className="w-12 text-center"></span>
        </div>

        <div className="flex flex-col">
          {songs.length === 0 ? (
            <p className="text-center text-gray-500 py-10 italic">Esta playlist está vacía. Busca canciones en el panel principal para añadirlas.</p>
          ) : (
            songs.map((song, index) => (
              <div key={`${song.videoId}-${index}`} className={`group grid grid-cols-[auto_1fr_auto] md:grid-cols-[auto_1fr_1fr_auto] gap-4 px-4 py-3 rounded-lg hover:bg-[#1e1f22] items-center transition-colors ${isRemoving === song.videoId ? 'opacity-50' : ''}`}>
                <span className="w-8 text-center text-gray-500 text-sm">{index + 1}</span>
                
                <div className="flex items-center gap-3 min-w-0">
                  <img src={song.thumbnail} className="w-10 h-10 object-cover rounded" alt="cover" />
                  <div className="flex flex-col min-w-0">
                    <span className="text-base font-bold text-white truncate">{song.title}</span>
                    <span className="text-sm text-gray-400 truncate hover:underline cursor-pointer">{song.artist}</span>
                  </div>
                </div>

                <div className="hidden md:flex items-center gap-2 min-w-0">
                  {song.requesterAvatar && <img src={song.requesterAvatar} className="w-5 h-5 rounded-full" alt="avatar" />}
                  <span className="text-sm text-gray-400 truncate">{song.requester || session.user.name}</span>
                </div>

                <button 
                  onClick={() => handleRemoveSong(song.videoId)}
                  className="w-12 flex justify-center text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                  title="Quitar de la Playlist"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            ))
          )}
        </div>
      </div>
      
    </section>
  );
}