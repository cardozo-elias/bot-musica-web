"use client";
import React, { useState } from 'react';
import Link from 'next/link';

// --- GENERADOR DE MOSAICOS 2x2 ---
const MosaicCover = ({ songs }) => {
  if (!songs || songs.length === 0) {
    return (
      <div className="w-full h-full bg-[#1e1f22] flex items-center justify-center text-gray-600">
        <svg className="w-12 h-12 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
        </svg>
      </div>
    );
  }

  const uniqueCovers = [];
  const seenIds = new Set();
  for (const song of songs) {
    if (!seenIds.has(song.videoId) && song.thumbnail) {
      seenIds.add(song.videoId);
      uniqueCovers.push(song.thumbnail);
    }
  }

  if (uniqueCovers.length < 4) {
    return <img src={uniqueCovers[0]} alt="Cover" className="w-full h-full object-cover" />;
  }

  return (
    <div className="w-full h-full grid grid-cols-2 grid-rows-2 gap-0">
      <img src={uniqueCovers[0]} className="w-full h-full object-cover" alt="Cover 1" />
      <img src={uniqueCovers[1]} className="w-full h-full object-cover" alt="Cover 2" />
      <img src={uniqueCovers[2]} className="w-full h-full object-cover" alt="Cover 3" />
      <img src={uniqueCovers[3]} className="w-full h-full object-cover" alt="Cover 4" />
    </div>
  );
};

export default function PlaylistsContent({ initialPlaylists }) {
  const [playlists, setPlaylists] = useState(initialPlaylists);
  
  // Estados para la Modal de Creación
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [plName, setPlName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedSong, setSelectedSong] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Estados para Importación de Spotify
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importUrl, setImportUrl] = useState("");
  const [isImporting, setIsImporting] = useState(false);

  // --- HANDLERS ---
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

  const handleCreate = async () => {
    if (!plName.trim()) return alert("Ponle un nombre a tu playlist.");
    setIsSaving(true);
    try {
      const res = await fetch('/api/playlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: plName, song: selectedSong })
      });

      if (res.ok) {
        const newPlaylist = await res.json();
        setPlaylists([{ ...newPlaylist, songs: typeof newPlaylist.songs === 'string' ? JSON.parse(newPlaylist.songs) : newPlaylist.songs }, ...playlists]);
        setIsModalOpen(false); setPlName(""); setSearchQuery(""); setSearchResults([]); setSelectedSong(null);
      }
    } catch (err) { console.error(err); }
    setIsSaving(false);
  };

  const handleImport = async () => {
    if (!importUrl.trim()) return alert("Pega un enlace de Spotify.");
    setIsImporting(true);
    try {
      const res = await fetch('/api/playlists/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: importUrl })
      });

      if (res.ok) {
        const newPlaylist = await res.json();
        setPlaylists([{ ...newPlaylist, songs: typeof newPlaylist.songs === 'string' ? JSON.parse(newPlaylist.songs) : newPlaylist.songs }, ...playlists]);
        setIsImportModalOpen(false); 
        setImportUrl("");
      } else {
        const errorData = await res.json();
        alert(errorData.error || "Ocurrió un error al importar.");
      }
    } catch (err) { console.error(err); alert("Error de conexión."); }
    setIsImporting(false);
  };

  return (
    <>
      <section className="flex-1 flex flex-col overflow-y-auto custom-scrollbar bg-[#0a0a0c] pb-32">
        <div className="p-8 md:p-12 max-w-[1600px] w-full mx-auto">
          <h1 className="text-4xl font-black tracking-tight mb-8 text-white">Tus Playlists</h1>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            
            {/* TARJETA 1: Crear Manualmente */}
            <div 
              onClick={() => setIsModalOpen(true)}
              className="bg-[#111214] hover:bg-[#1e1f22] p-4 rounded-xl border border-transparent hover:border-[#2b2d31] transition-all cursor-pointer group flex flex-col items-center justify-center aspect-[3/4] shadow-md"
            >
               <div className="w-16 h-16 rounded-full bg-[#2b2d31] flex items-center justify-center text-[#57F287] group-hover:bg-[#57F287] group-hover:text-black transition-colors mb-4 shadow-inner">
                  <span className="text-3xl leading-none font-light">+</span>
               </div>
               <span className="font-bold text-gray-300 group-hover:text-white transition-colors">Crear Playlist</span>
            </div>

            {/* TARJETA 2: IMPORTAR DE SPOTIFY */}
            <div 
              onClick={() => setIsImportModalOpen(true)}
              className="bg-[#111214] hover:bg-[#1e1f22] p-4 rounded-xl border border-transparent hover:border-[#1DB954] transition-all cursor-pointer group flex flex-col items-center justify-center aspect-[3/4] shadow-md relative overflow-hidden"
            >
               <div className="absolute inset-0 bg-[#1DB954]/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
               <div className="w-16 h-16 rounded-full bg-[#1e1f22] flex items-center justify-center text-[#1DB954] transition-colors mb-4 shadow-inner relative z-10">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
               </div>
               <span className="font-bold text-gray-300 group-hover:text-white transition-colors relative z-10 text-center">Importar Playlist<br/><span className="text-xs font-normal text-gray-500">Spotify / Tidal</span></span>
            </div>

            {/* Mapeo de las Playlists Reales */}
            {playlists.map(pl => (
              <Link href={`/playlists/${pl.id}`} key={pl.id} className="bg-[#111214] hover:bg-[#1e1f22] p-4 rounded-xl border border-transparent hover:border-[#2b2d31] transition-all group flex flex-col shadow-md">
                <div className="relative mb-4 rounded-md overflow-hidden shadow-lg aspect-square bg-[#1e1f22]">
                  <MosaicCover songs={pl.songs} />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 flex items-end justify-end p-3">
                      <button className="w-12 h-12 bg-[#57F287] rounded-full flex items-center justify-center text-black opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 hover:scale-105 hover:bg-[#45d16f] shadow-xl">
                          <svg className="w-6 h-6 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                      </button>
                  </div>
                </div>
                <h3 className="font-bold text-white text-base truncate mb-1">{pl.name}</h3>
                <p className="text-xs text-gray-500 font-medium truncate">
                  {pl.songs?.length || 0} pistas • {pl.songs?.length > 0 ? pl.songs[0].artist : 'Vacía'}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* VENTANA MODAL (CREAR PLAYLIST) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#111214] border border-[#2b2d31] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col animate-slideUp">
            
            <div className="p-6 border-b border-[#2b2d31] flex justify-between items-center">
              <h2 className="text-xl font-black text-white">Nueva Playlist</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-white text-2xl leading-none">&times;</button>
            </div>

            <div className="p-6 flex flex-col gap-6">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">Nombre de la Playlist</label>
                <input 
                  type="text" 
                  autoFocus
                  placeholder="Ej: Rock Clásico..." 
                  className="w-full bg-[#1e1f22] text-white border border-transparent focus:border-[#57F287] rounded-lg p-3 outline-none font-bold transition"
                  value={plName}
                  onChange={(e) => setPlName(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">Buscar primera canción (Opcional)</label>
                <form onSubmit={handleSearch} className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Busca un artista o tema..." 
                    className="flex-1 bg-[#1e1f22] text-white rounded-lg p-3 outline-none text-sm focus:bg-[#2b2d31] transition"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <button type="submit" disabled={isSearching} className="bg-[#2b2d31] hover:bg-white hover:text-black text-white px-4 rounded-lg font-bold transition">
                    {isSearching ? '...' : 'Buscar'}
                  </button>
                </form>

                {searchResults.length > 0 && (
                  <div className="mt-4 flex flex-col gap-2 max-h-48 overflow-y-auto custom-scrollbar pr-2">
                    {searchResults.map((track, i) => (
                      <div 
                        key={i} 
                        onClick={() => setSelectedSong(track)}
                        className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition border ${selectedSong?.videoId === track.videoId ? 'border-[#57F287] bg-[#57F287]/10' : 'border-transparent hover:bg-[#1e1f22]'}`}
                      >
                        <img src={track.thumbnail} className="w-10 h-10 rounded object-cover" alt="Cover" />
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className="text-sm font-bold text-white truncate">{track.title}</span>
                          <span className="text-[10px] text-gray-400 font-bold uppercase truncate">{track.artist}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-[#2b2d31] bg-[#0a0a0c] flex justify-end gap-3">
              <button onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-lg font-bold text-sm text-gray-400 hover:text-white transition">Cancelar</button>
              <button onClick={handleCreate} disabled={isSaving || !plName.trim()} className="px-5 py-2.5 rounded-lg font-bold text-sm bg-[#57F287] hover:bg-[#45d16f] text-black transition disabled:opacity-50 shadow-lg">
                {isSaving ? 'Creando...' : 'Crear Playlist'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* VENTANA MODAL (IMPORTAR SPOTIFY) */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#111214] border border-[#1DB954]/50 rounded-2xl shadow-[0_0_50px_rgba(29,185,84,0.1)] w-full max-w-md overflow-hidden flex flex-col animate-slideUp">
            
            <div className="p-6 border-b border-[#2b2d31] flex justify-between items-center bg-gradient-to-r from-[#111214] to-[#1DB954]/10">
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <svg className="w-6 h-6 text-[#1DB954]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.54.6.3 1.02zm1.44-3.3c-.301.42-.84.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.6.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>
                Importar Playlist
              </h2>
              <button onClick={() => setIsImportModalOpen(false)} className="text-gray-500 hover:text-white text-2xl leading-none">×</button>
            </div>

            <div className="p-6 flex flex-col gap-6">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">Enlace de Spotify</label>
                <input 
                  type="url" 
                  autoFocus
                  placeholder="Pega un enlace de Spotify o Tidal..." 
                  className="w-full bg-[#1e1f22] text-white border border-transparent focus:border-[#1DB954] rounded-lg p-3 outline-none font-bold transition"
                  value={importUrl}
                  onChange={(e) => setImportUrl(e.target.value)}
                />
                <p className="text-[10px] text-gray-500 mt-2">Asegúrate de que la playlist sea pública. Puede tardar unos segundos dependiendo del tamaño de la lista.</p>
              </div>
            </div>

            <div className="p-4 border-t border-[#2b2d31] bg-[#0a0a0c] flex justify-end gap-3">
              <button onClick={() => setIsImportModalOpen(false)} className="px-5 py-2.5 rounded-lg font-bold text-sm text-gray-400 hover:text-white transition">Cancelar</button>
              <button onClick={handleImport} disabled={isImporting || !importUrl.trim()} className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-sm bg-[#1DB954] hover:bg-[#1ed760] text-black transition disabled:opacity-50 shadow-lg">
                {isImporting ? <><span className="animate-spin text-xl leading-none">↻</span> Extrayendo...</> : 'Comenzar Importación'}
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}