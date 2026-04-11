"use client";
import React, { useState, useEffect } from 'react';
import { io } from "socket.io-client";
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

// --- MOSAICO 2x2 ---
const MosaicCoverPanel = ({ songs }) => {
  if (!songs || songs.length === 0) {
    return <div className="w-32 h-32 md:w-40 md:h-40 bg-[#111214] rounded-xl flex items-center justify-center border border-white/10"><span className="text-3xl text-gray-600">🎵</span></div>;
  }
  
  const uniqueCovers = []; 
  const seenIds = new Set();
  
  for (const song of songs) { 
    if (!seenIds.has(song.videoId) && song.thumbnail && !song.thumbnail.includes('ui-avatars') && !song.thumbnail.includes('Q2v1vV7.png')) { 
      seenIds.add(song.videoId); 
      uniqueCovers.push(song.thumbnail); 
    } 
  }
  
  if (uniqueCovers.length === 0) return <div className="w-32 h-32 md:w-40 md:h-40 bg-[#111214] rounded-xl flex items-center justify-center border border-white/10"><span className="text-3xl text-gray-600">🎵</span></div>;
  if (uniqueCovers.length < 4) return <img src={uniqueCovers[0]} alt="Cover" className="w-32 h-32 md:w-40 md:h-40 rounded-xl object-cover border border-white/10" />;
  
  return (
    <div className="w-32 h-32 md:w-40 md:h-40 grid grid-cols-2 grid-rows-2 rounded-xl overflow-hidden border border-white/10 shadow-lg">
      <img src={uniqueCovers[0]} className="w-full h-full object-cover" alt="Cover 1" />
      <img src={uniqueCovers[1]} className="w-full h-full object-cover" alt="Cover 2" />
      <img src={uniqueCovers[2]} className="w-full h-full object-cover" alt="Cover 3" />
      <img src={uniqueCovers[3]} className="w-full h-full object-cover" alt="Cover 4" />
    </div>
  );
};

export default function PlaylistDetailClient({ playlist, session, isOwner = true, isLikesPlaylist = false }) {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);

  const [songs, setSongs] = useState(playlist.songs || []);
  const [isRemoving, setIsRemoving] = useState(null);
  const [socket, setSocket] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isAdding, setIsAdding] = useState(null);

  const [recommendations, setRecommendations] = useState([]);
  const [isFetchingRecs, setIsFetchingRecs] = useState(false);

  const [plName, setPlName] = useState(playlist.name);
  const [isPublic, setIsPublic] = useState(playlist.is_public || false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editName, setEditName] = useState(playlist.name);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    const botUrl = process.env.NEXT_PUBLIC_BOT_URL || "http://localhost:3001";
    const newSocket = io(botUrl, { extraHeaders: { "ngrok-skip-browser-warning": "true" } });
    setSocket(newSocket);
    return () => newSocket.disconnect();
  }, []);

  useEffect(() => {
    if (songs.length > 0 && recommendations.length === 0 && isOwner && !isLikesPlaylist) {
      fetchRecommendations();
    }
  }, [songs.length, isOwner, isLikesPlaylist]);

  const fetchRecommendations = async () => {
    if (songs.length === 0) return;
    setIsFetchingRecs(true);
    try {
      const uniqueArtists = [...new Set(songs.map(s => s.artist).filter(Boolean))];
      const shuffledArtists = uniqueArtists.sort(() => 0.5 - Math.random()).slice(0, 3);
      
      let allFetchedTracks = [];
      for (const artist of shuffledArtists) {
        const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(artist)}&entity=song&limit=15`);
        const data = await res.json();
        if (data.results) allFetchedTracks = allFetchedTracks.concat(data.results);
      }

      const existingIds = new Set(songs.map(s => s.videoId));
      const existingTitles = new Set(songs.map(s => s.title.toLowerCase()));
      const cleanRecs = [];
      const seenRecIds = new Set();

      for (const t of allFetchedTracks) {
        const fakeId = `itunes_${t.trackId}`;
        const titleLower = t.trackName.toLowerCase();
        
        if (!existingIds.has(fakeId) && !existingTitles.has(titleLower) && !seenRecIds.has(fakeId)) {
          seenRecIds.add(fakeId);
          cleanRecs.push({
            title: t.trackName,
            artist: t.artistName,
            videoId: fakeId,
            thumbnail: t.artworkUrl100.replace('100x100bb', '600x600bb'),
            url: t.trackViewUrl
          });
        }
      }
      setRecommendations(cleanRecs.sort(() => 0.5 - Math.random()).slice(0, 5));
    } catch (e) { console.error(e); }
    setIsFetchingRecs(false);
  };

  const handlePlayPlaylist = () => {
    if (!socket || songs.length === 0) return;
    setIsPlaying(true);
    socket.emit("cmd_play_playlist", {
      userId: session.user.id,
      playlistId: playlist.id,
      userName: session.user.name,
      userAvatar: session.user.image,
      isLikes: isLikesPlaylist // Indicador extra por si el bot lo necesita
    });
    setTimeout(() => setIsPlaying(false), 2000);
  };

  // 🔥 NUEVA FUNCIÓN: Reproducir pista individual
  const handlePlaySingle = (song) => {
    if (!socket) return;
    socket.emit("cmd_play", {
        userId: session.user.id,
        userName: session.user.name,
        userAvatar: session.user.image,
        query: song.url || `https://www.youtube.com/watch?v=${song.videoId}`
    });
  };

  const handleRemoveSong = async (videoId) => {
    if (!isOwner) return; 
    setIsRemoving(videoId);
    try {
      if (isLikesPlaylist) {
        // Lógica para borrar un like
        await fetch(`/api/likes`, { 
            method: 'DELETE', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ videoId }) 
        });
      } else {
        // Lógica para borrar de playlist normal
        await fetch('/api/playlists', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ playlistId: playlist.id, videoId })
        });
      }
      setSongs(songs.filter(s => s.videoId !== videoId));
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
        const newSongData = {
          ...track,
          requester: session.user.name,
          requesterAvatar: session.user.image
        };
        setSongs([...songs, newSongData]);
        setSearchResults(searchResults.filter(t => t.videoId !== track.videoId));
        setRecommendations(recommendations.filter(t => t.videoId !== track.videoId));
      }
    } catch (err) { console.error(err); }
    setIsAdding(null);
  };

  const handleDragEnd = async (result) => {
    if (!isOwner || isLikesPlaylist || !result.destination) return;

    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;

    if (sourceIndex === destinationIndex) return;

    const newSongsArray = Array.from(songs);
    const [movedSong] = newSongsArray.splice(sourceIndex, 1);
    newSongsArray.splice(destinationIndex, 0, movedSong);
    
    setSongs(newSongsArray);

    try {
      await fetch('/api/playlists', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          playlistId: playlist.id, 
          action: 'reorder', 
          newSongs: newSongsArray 
        })
      });
    } catch (e) { console.error(e); }
  };

  const handleSaveEdit = async () => {
    setIsSavingEdit(true);
    try {
      if (editName.trim() && editName !== plName) {
        await fetch('/api/playlists', { 
          method: 'PATCH', 
          headers: { 'Content-Type': 'application/json' }, 
          body: JSON.stringify({ playlistId: playlist.id, action: 'rename', newName: editName }) 
        });
        setPlName(editName); 
      }
      
      if (isPublic !== playlist.is_public) {
        await fetch('/api/playlists', { 
          method: 'PATCH', 
          headers: { 'Content-Type': 'application/json' }, 
          body: JSON.stringify({ playlistId: playlist.id, action: 'visibility', isPublic: isPublic }) 
        });
      }
      
      setIsEditModalOpen(false); 
    } catch (e) { console.error(e); }
    setIsSavingEdit(false);
  };

  const handleDeletePlaylist = async () => {
    if (!confirm("¿Estás seguro de que quieres eliminar esta playlist para siempre?")) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/playlists?id=${playlist.id}`, { method: 'DELETE' });
      if (res.ok) window.location.href = '/playlists';
    } catch (e) { console.error(e); }
    setIsDeleting(false);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <>
      <section className="flex-1 flex flex-col overflow-y-auto custom-scrollbar bg-transparent pb-32">
        <div className="p-6 md:p-10 max-w-[1400px] w-full mx-auto flex flex-col gap-6">
          
          {/* HEADER GLASSMORPHISM */}
          <div className="glass-panel rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8 shadow-xl">
            
            {/* PORTADA CONDICIONAL (Me Gusta vs Playlist Normal) */}
            {isLikesPlaylist ? (
                <div className="w-32 h-32 md:w-40 md:h-40 bg-gradient-to-br from-[#a855f7] to-[#ec4899] rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(236,72,153,0.3)] shrink-0">
                    <svg className="w-16 h-16 text-white drop-shadow-md" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                </div>
            ) : (
                <div className="shrink-0">
                    <MosaicCoverPanel songs={songs} />
                </div>
            )}
            
            <div className="flex flex-col flex-1 text-center md:text-left w-full justify-center h-full pt-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#a855f7] mb-1">
                {isLikesPlaylist ? 'Playlist Automática' : isPublic ? '🌐 Playlist Pública' : '🔒 Playlist Privada'}
              </span>
              <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight mb-4 truncate">{plName}</h1>
              
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-gray-400 font-medium mb-6 bg-white/5 w-fit px-4 py-2 rounded-lg border border-white/5">
                <div className="flex items-center gap-2">
                  {isOwner && <img src={session.user.image} className="w-5 h-5 rounded-full" alt="User" />}
                  <span className="text-white font-bold">{isOwner ? session.user.name : "Playlist de Comunidad"}</span>
                </div>
                <span>•</span>
                <span className="font-mono text-xs">{songs.length} pistas</span>
              </div>

              <div className="flex items-center justify-center md:justify-start gap-3">
                <button 
                  onClick={handlePlayPlaylist}
                  disabled={songs.length === 0}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-full font-bold transition-all shadow-[0_0_15px_rgba(168,85,247,0.4)] ${isPlaying ? 'bg-[#ec4899] text-white scale-95' : 'bg-gradient-to-r from-[#a855f7] to-[#ec4899] hover:brightness-110 text-white'} ${songs.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                  Reproducir Todo
                </button>

                {(!isLikesPlaylist && (isOwner || isPublic)) && (
                  <button 
                    onClick={handleShare}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-bold border transition-colors ${copiedLink ? 'bg-[#a855f7] border-[#a855f7] text-white' : 'border-white/10 hover:bg-white/5 text-gray-300'}`}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                    {copiedLink ? '¡Copiado!' : 'Compartir'}
                  </button>
                )}

                {isOwner && !isLikesPlaylist && (
                  <>
                    <button 
                      onClick={() => { setShowSearch(!showSearch); setSearchResults([]); setSearchQuery(""); }}
                      className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-bold border transition-colors ${showSearch ? 'bg-white/10 border-[#a855f7] text-white' : 'border-white/10 hover:bg-white/5 text-gray-300'}`}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                      Añadir
                    </button>

                    <button 
                      onClick={() => setIsEditModalOpen(true)} 
                      className="flex items-center justify-center p-2.5 rounded-full border border-white/10 hover:bg-white/5 text-gray-400 hover:text-[#a855f7] transition-colors" 
                      title="Ajustes de Playlist"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* BUSCADOR */}
          {showSearch && isOwner && !isLikesPlaylist && (
            <div className="glass-panel rounded-2xl p-6 shadow-lg animate-slideDown">
              <h3 className="text-sm font-black uppercase text-white tracking-widest mb-4">Buscador Rápido</h3>
              <form onSubmit={handleSearch} className="flex gap-2 mb-4">
                <input 
                  type="text" 
                  autoFocus
                  placeholder="Escribe una canción o artista..." 
                  className="flex-1 bg-white/5 border border-white/10 text-white rounded-xl p-3 outline-none text-sm focus:border-[#a855f7] transition"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button type="submit" disabled={isSearching} className="bg-white/10 hover:bg-white/20 text-white px-6 rounded-xl font-bold transition border border-white/5 min-w-[100px]">
                  {isSearching ? <span className="animate-pulse">...</span> : 'Buscar'}
                </button>
              </form>

              {searchResults.length > 0 && (
                <div className="flex flex-col gap-2">
                  {searchResults.map((track, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-black/20 border border-white/5 rounded-xl hover:border-[#a855f7]/50 transition-colors group">
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
                        className="px-4 py-2 rounded border border-white/10 text-xs font-bold text-gray-300 hover:text-white hover:bg-[#a855f7] hover:border-[#a855f7] transition-all disabled:opacity-50"
                      >
                        {isAdding === track.videoId ? 'Añadiendo...' : 'Añadir'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TABLA DE CANCIONES (GLASSMORPHISM + PLAY SINGLE) */}
          <div className="glass-panel rounded-2xl overflow-hidden shadow-xl">
            <div className="grid grid-cols-[auto_1fr_auto] md:grid-cols-[auto_1fr_1fr_auto] gap-4 px-6 py-4 border-b border-white/5 bg-black/40 text-[10px] font-black text-[#a855f7] uppercase tracking-widest">
              <span className="w-8 text-center">#</span>
              <span>Pista</span>
              <span className="hidden md:block">Guardado Por</span>
              <span className="w-16 text-center"></span>
            </div>

            {isMounted && (
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="playlist-songs" isDropDisabled={!isOwner || isLikesPlaylist}>
                  {(provided) => (
                    <div 
                      {...provided.droppableProps} 
                      ref={provided.innerRef} 
                      className="flex flex-col p-2 min-h-[100px]"
                    >
                      {songs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                          <p className="text-gray-500 font-medium mb-4">Esta lista está vacía.</p>
                          {isOwner && !isLikesPlaylist && (
                            <button onClick={() => setShowSearch(true)} className="text-[#a855f7] hover:underline font-bold text-sm">
                              Usa el buscador arriba para empezar a añadir música.
                            </button>
                          )}
                        </div>
                      ) : (
                        songs.map((song, index) => {
                          const hasValidCover = song.thumbnail && !song.thumbnail.includes('ui-avatars') && !song.thumbnail.includes('Q2v1vV7.png');

                          return (
                            <Draggable key={`${song.videoId}-${index}`} draggableId={`${song.videoId}-${index}`} index={index} isDragDisabled={!isOwner || isLikesPlaylist}>
                              {(provided, snapshot) => (
                                <div 
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  className={`group grid grid-cols-[auto_1fr_auto] md:grid-cols-[auto_1fr_1fr_auto] gap-4 px-4 py-3 rounded-xl items-center transition-colors ${snapshot.isDragging ? 'bg-white/10 shadow-2xl opacity-90 border border-[#a855f7]/50 z-50' : 'hover:bg-white/5 border border-transparent'} ${isRemoving === song.videoId ? 'opacity-30 scale-[0.98]' : ''}`}
                                  style={provided.draggableProps.style}
                                >
                                  {/* Grip Handle */}
                                  <div 
                                    {...provided.dragHandleProps} 
                                    className={`w-8 h-8 flex items-center justify-center text-gray-500 rounded transition-colors ${!isLikesPlaylist && isOwner ? 'hover:bg-white/10 hover:text-white cursor-grab' : ''}`}
                                  >
                                    <div className={`${!isLikesPlaylist && isOwner ? 'group-hover:hidden' : ''} font-mono text-xs`}>{String(index + 1).padStart(2, '0')}</div>
                                    {!isLikesPlaylist && isOwner && (
                                      <div className="hidden group-hover:block">
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M2 5a1 1 0 011-1h14a1 1 0 110 2H3a1 1 0 01-1-1zm0 5a1 1 0 011-1h14a1 1 0 110 2H3a1 1 0 01-1-1zm1 4a1 1 0 100 2h14a1 1 0 100-2H3z"/></svg>
                                      </div>
                                    )}
                                  </div>
                                  
                                  <div className="flex items-center gap-4 min-w-0">
                                    {hasValidCover ? (
                                      <img src={song.thumbnail} className="w-10 h-10 object-cover rounded shadow-sm border border-white/5" alt="cover" />
                                    ) : (
                                      <div className="w-10 h-10 flex items-center justify-center bg-white/5 rounded shadow-sm border border-white/5">
                                        <span className="text-xl">🎵</span>
                                      </div>
                                    )}
                                    
                                    <div className="flex flex-col min-w-0">
                                      <span className="text-sm font-bold text-gray-200 truncate group-hover:text-white transition-colors">{song.title}</span>
                                      <span className="text-[11px] font-medium uppercase tracking-wide text-gray-500 truncate">{song.artist}</span>
                                    </div>
                                  </div>

                                  <div className="hidden md:flex items-center gap-2 min-w-0">
                                    {isLikesPlaylist ? (
                                      // Ícono de Corazón Rosado para Playlist de Likes
                                      <svg className="w-4 h-4 text-[#ec4899]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                                    ) : song.requesterAvatar ? (
                                      <img src={song.requesterAvatar} className="w-5 h-5 rounded-full" alt="avatar" />
                                    ) : (
                                      <div className="w-5 h-5 rounded-full bg-white/5"></div>
                                    )}
                                    <span className="text-xs font-medium text-gray-400 truncate">{isLikesPlaylist ? 'Tú' : (song.requester || session.user.name)}</span>
                                  </div>

                                  {/* BOTONES ACCIÓN (REPRODUCIR SINGLE Y ELIMINAR) */}
                                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button 
                                        onClick={() => handlePlaySingle(song)} 
                                        className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-[#a855f7] hover:bg-[#a855f7]/10 transition-all" 
                                        title="Reproducir esta pista"
                                      >
                                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                                      </button>
                                      {isOwner && (
                                          <button 
                                            onClick={() => handleRemoveSong(song.videoId)} 
                                            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:text-[#ec4899] hover:bg-[#ec4899]/10 transition-all" 
                                            title="Quitar"
                                          >
                                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                          </button>
                                      )}
                                  </div>

                                </div>
                              )}
                            </Draggable>
                          );
                        })
                      )}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            )}
          </div>

          {/* RECOMENDACIONES */}
          {songs.length > 0 && isOwner && !isLikesPlaylist && (
            <div className="glass-panel rounded-2xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <div className="flex flex-col">
                  <h3 className="text-sm font-black uppercase text-white tracking-widest">Recomendaciones</h3>
                  <span className="text-xs text-gray-500 font-medium">Basado en los artistas de esta playlist</span>
                </div>
                <button 
                  onClick={fetchRecommendations} 
                  disabled={isFetchingRecs}
                  className="text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-white transition flex items-center gap-2 disabled:opacity-50"
                >
                  {isFetchingRecs ? 'Cargando...' : '↻ Refrescar'}
                </button>
              </div>

              {recommendations.length === 0 && !isFetchingRecs ? (
                <p className="text-xs text-gray-500 italic text-center py-4">Agrega más variedad a tu playlist para recibir recomendaciones.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {recommendations.map((track, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-black/20 border border-white/5 rounded-xl hover:border-[#a855f7]/50 transition-colors group">
                      <div className="flex items-center gap-4 min-w-0">
                        <img src={track.thumbnail} className="w-10 h-10 rounded object-cover shadow-sm" alt="Cover" />
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-bold text-white truncate">{track.title}</span>
                          <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wide truncate">{track.artist}</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleAddSong(track)}
                        disabled={isAdding === track.videoId}
                        className="px-4 py-2 rounded border border-white/10 text-xs font-bold text-gray-300 hover:text-white hover:bg-[#a855f7] hover:border-[#a855f7] transition-all disabled:opacity-50"
                      >
                        {isAdding === track.videoId ? 'Añadiendo...' : 'Añadir'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </section>

      {/* 🔥 MODAL DE AJUSTES/EDICIÓN 🔥 */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="glass-panel rounded-3xl p-8 w-full max-w-md shadow-[0_0_50px_rgba(168,85,247,0.15)] border border-[#a855f7]/30 animate-slideUp">
            
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black text-white">Ajustes de Playlist</h2>
              <button onClick={() => setIsEditModalOpen(false)} className="text-gray-500 hover:text-white text-2xl leading-none">×</button>
            </div>

            <div className="flex flex-col gap-6">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">Nombre de la Playlist</label>
                <input 
                  type="text" 
                  className="w-full bg-white/5 border border-white/10 focus:border-[#a855f7] text-white rounded-xl p-4 outline-none font-bold transition shadow-inner"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
              </div>

              {/* Botón de Privacidad */}
              <div className="flex items-center justify-between bg-white/5 p-4 rounded-xl border border-white/10">
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-white">Playlist Pública</span>
                  <span className="text-xs text-gray-400">Cualquiera con el enlace podrá verla.</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={isPublic} onChange={() => setIsPublic(!isPublic)} />
                  <div className="w-11 h-6 bg-white/10 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#a855f7]"></div>
                </label>
              </div>

              {/* Botón de Eliminación (Peligro) */}
              <div className="p-4 border border-[#ec4899]/30 bg-[#ec4899]/10 rounded-xl flex flex-col items-start gap-3 mt-2">
                <span className="text-sm font-bold text-[#ec4899]">Zona de Peligro</span>
                <span className="text-xs text-gray-400">Una vez que elimines una playlist, no hay vuelta atrás.</span>
                <button 
                  onClick={handleDeletePlaylist} 
                  disabled={isDeleting} 
                  className="px-4 py-2 bg-[#ec4899]/20 text-[#ec4899] hover:bg-[#ec4899] hover:text-white rounded-lg text-xs font-bold transition-colors mt-2"
                >
                  {isDeleting ? 'Eliminando...' : 'Eliminar Playlist'}
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8">
              <button onClick={() => setIsEditModalOpen(false)} className="px-5 py-3 rounded-full font-bold text-sm text-gray-400 hover:text-white transition">Cancelar</button>
              <button 
                onClick={handleSaveEdit} 
                disabled={isSavingEdit || !editName.trim()} 
                className="px-6 py-3 rounded-full font-bold text-sm bg-gradient-to-r from-[#a855f7] to-[#ec4899] text-white transition disabled:opacity-50 shadow-[0_0_15px_rgba(168,85,247,0.4)] hover:brightness-110"
              >
                {isSavingEdit ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}