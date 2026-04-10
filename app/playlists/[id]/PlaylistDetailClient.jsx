"use client";
import React, { useState, useEffect } from 'react';
import { io } from "socket.io-client";

// Mosaico más compacto y cuadrado para el nuevo diseño
const MosaicCoverPanel = ({ songs }) => {
  if (!songs || songs.length === 0) {
    return <div className="w-32 h-32 md:w-40 md:h-40 bg-[#1e1f22] rounded-xl flex items-center justify-center border border-[#2b2d31]"><span className="text-3xl text-gray-600">🎵</span></div>;
  }
  const uniqueCovers = []; const seenIds = new Set();
  for (const song of songs) { if (!seenIds.has(song.videoId) && song.thumbnail) { seenIds.add(song.videoId); uniqueCovers.push(song.thumbnail); } }
  
  if (uniqueCovers.length < 4) return <img src={uniqueCovers[0]} alt="Cover" className="w-32 h-32 md:w-40 md:h-40 rounded-xl object-cover border border-[#2b2d31]" />;
  
  return (
    <div className="w-32 h-32 md:w-40 md:h-40 grid grid-cols-2 grid-rows-2 rounded-xl overflow-hidden border border-[#2b2d31]">
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

  // Estados del Buscador Integrado
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isAdding, setIsAdding] = useState(null);

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
    setTimeout(() => setIsPlaying(false), 2000);
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

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(searchQuery)}&entity=song&limit=5`);
      const data = await res.json();
      if (data.results) {
        const cleanResults = data.results.map(t => ({
          title: t.trackName,
          artist: t.artistName,
          videoId: `itunes_${t.trackId}`, 
          thumbnail: t.artworkUrl100.replace('100x100bb', '600x600bb'),
          url: t.trackViewUrl
        }));
        setSearchResults(cleanResults);
      }
    } catch (err) { console.error(err); }
    setIsSearching(false);
  };

  const handleAddSong = async (track) => {
    setIsAdding(track.videoId);
    try {
      const res = await fetch('/api/playlists', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playlistId: playlist.id, song: track })
      });

      if (res.ok) {
        // Actualizamos la UI al instante
        const newSongData = {
          ...track,
          requester: session.user.name,
          requesterAvatar: session.user.image
        };
        setSongs([...songs, newSongData]);
        // Removemos de los resultados para dar feedback visual
        setSearchResults(searchResults.filter(t => t.videoId !== track.videoId));
      }
    } catch (err) { console.error(err); }
    setIsAdding(null);
  };

  return (
    <section className="flex-1 flex flex-col overflow-y-auto custom-scrollbar bg-[#0a0a0c]">
      <div className="p-6 md:p-10 max-w-[1400px] w-full mx-auto flex flex-col gap-6">
        
        {/* PANEL HEADER (Estilo Dashboard en lugar de Spotify) */}
        <div className="bg-[#111214] border border-[#1e1f22] rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8 shadow-sm">
          <MosaicCoverPanel songs={songs} />
          
          <div className="flex flex-col flex-1 text-center md:text-left w-full">
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Colección de Usuario</span>
            <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight mb-4 truncate">{playlist.name}</h1>
            
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-gray-400 font-medium mb-6 bg-[#1e1f22]/50 w-fit px-4 py-2 rounded-lg border border-[#2b2d31]">
              <div className="flex items-center gap-2">
                <img src={session.user.image} className="w-5 h-5 rounded-full" alt="User" />
                <span className="text-white">{session.user.name}</span>
              </div>
              <span>•</span>
              <span className="font-mono text-xs">{songs.length} pistas</span>
            </div>

            {/* ACTION BAR: Botones estilo panel de control */}
            <div className="flex items-center justify-center md:justify-start gap-3">
              <button 
                onClick={handlePlayPlaylist}
                disabled={songs.length === 0}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold transition-all shadow-md ${isPlaying ? 'bg-[#45d16f] text-black scale-95' : 'bg-[#57F287] hover:bg-[#45d16f] text-black'} ${songs.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                Reproducir Todo
              </button>

              <button 
                onClick={() => { setShowSearch(!showSearch); setSearchResults([]); setSearchQuery(""); }}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold border transition-colors ${showSearch ? 'bg-[#1e1f22] border-[#57F287] text-white' : 'bg-transparent border-[#2b2d31] hover:bg-[#1e1f22] text-gray-300'}`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                Añadir Canciones
              </button>
            </div>
          </div>
        </div>

        {/* MÓDULO DE BÚSQUEDA INTEGRADO */}
        {showSearch && (
          <div className="bg-[#111214] border border-[#57F287]/30 rounded-2xl p-6 shadow-lg animate-slideDown">
            <h3 className="text-sm font-black uppercase text-white tracking-widest mb-4">Buscador Rápido</h3>
            <form onSubmit={handleSearch} className="flex gap-2 mb-4">
              <input 
                type="text" 
                autoFocus
                placeholder="Escribe una canción o artista..." 
                className="flex-1 bg-[#1e1f22] border border-[#2b2d31] text-white rounded-lg p-3 outline-none text-sm focus:border-[#57F287] transition"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button type="submit" disabled={isSearching} className="bg-[#2b2d31] hover:bg-white hover:text-black text-white px-6 rounded-lg font-bold transition flex items-center justify-center min-w-[100px]">
                {isSearching ? <span className="animate-pulse">...</span> : 'Buscar'}
              </button>
            </form>

            {searchResults.length > 0 && (
              <div className="flex flex-col gap-2">
                {searchResults.map((track, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-[#0a0a0c] border border-[#1e1f22] rounded-xl hover:border-[#2b2d31] transition-colors group">
                    <div className="flex items-center gap-4 min-w-0">
                      <img src={track.thumbnail} className="w-12 h-12 rounded object-cover" alt="Cover" />
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-bold text-white truncate">{track.title}</span>
                        <span className="text-xs text-gray-400 font-medium truncate">{track.artist}</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleAddSong(track)}
                      disabled={isAdding === track.videoId}
                      className="px-4 py-2 rounded border border-[#2b2d31] text-xs font-bold text-gray-300 hover:text-black hover:bg-white hover:border-white transition-all disabled:opacity-50"
                    >
                      {isAdding === track.videoId ? 'Añadiendo...' : 'Añadir'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TABLA DE CANCIONES (Estilo Dashboard) */}
        <div className="bg-[#111214] border border-[#1e1f22] rounded-2xl overflow-hidden shadow-sm">
          <div className="grid grid-cols-[auto_1fr_auto] md:grid-cols-[auto_1fr_1fr_auto] gap-4 px-6 py-4 border-b border-[#1e1f22] bg-[#0a0a0c]/50 text-[10px] font-black text-gray-500 uppercase tracking-widest">
            <span className="w-6 text-center">#</span>
            <span>Pista</span>
            <span className="hidden md:block">Guardado Por</span>
            <span className="w-8 text-center"></span>
          </div>

          <div className="flex flex-col p-2">
            {songs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                <p className="text-gray-500 font-medium mb-4">Esta playlist está vacía.</p>
                <button onClick={() => setShowSearch(true)} className="text-[#57F287] hover:underline font-bold text-sm">
                  Usa el buscador arriba para empezar a añadir música.
                </button>
              </div>
            ) : (
              songs.map((song, index) => (
                <div key={`${song.videoId}-${index}`} className={`group grid grid-cols-[auto_1fr_auto] md:grid-cols-[auto_1fr_1fr_auto] gap-4 px-4 py-3 rounded-xl hover:bg-[#1e1f22] items-center transition-colors ${isRemoving === song.videoId ? 'opacity-30 scale-[0.98]' : ''}`}>
                  <span className="w-6 text-center font-mono text-gray-500 text-xs">{String(index + 1).padStart(2, '0')}</span>
                  
                  <div className="flex items-center gap-4 min-w-0">
                    <img src={song.thumbnail} className="w-10 h-10 object-cover rounded shadow-sm border border-white/5" alt="cover" />
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-bold text-gray-200 truncate">{song.title}</span>
                      <span className="text-[11px] font-medium uppercase tracking-wide text-gray-500 truncate">{song.artist}</span>
                    </div>
                  </div>

                  <div className="hidden md:flex items-center gap-2 min-w-0">
                    {song.requesterAvatar ? (
                      <img src={song.requesterAvatar} className="w-5 h-5 rounded-full" alt="avatar" />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-[#2b2d31]"></div>
                    )}
                    <span className="text-xs font-medium text-gray-400 truncate">{song.requester || session.user.name}</span>
                  </div>

                  <button 
                    onClick={() => handleRemoveSong(song.videoId)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-400/10 opacity-0 group-hover:opacity-100 transition-all"
                    title="Eliminar de la lista"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </section>
  );
}