"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '../../../components/LanguageContext';

// --- ÍCONOS SVG MINIMALISTAS ---
const PlusIcon = () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>;
const ImportIcon = () => <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.69 14.4c-.15.25-.46.33-.7.18-1.92-1.17-4.34-1.44-7.2-.79-.28.06-.54-.11-.6-.39-.06-.28.11-.54.39-.6 3.12-.71 5.79-.4 7.93.9.25.15.33.46.18.7zm.96-2.14c-.19.31-.58.42-.89.23-2.2-1.35-5.6-1.73-8.08-.94-.35.11-.72-.08-.83-.43-.11-.35.08-.72.43-.83 2.84-.89 6.6-.46 9.14 1.08.31.19.42.58.23.89zm.06-2.25c-2.63-1.56-6.96-1.7-9.48-.94-.41.13-.85-.11-.98-.52-.13-.41.11-.85.52-.98 2.96-.89 7.78-.71 10.82.79.38.19.53.66.34 1.04-.19.38-.66.53-1.04.34z"/></svg>;
const MusicNoteIcon = () => <svg className="w-12 h-12 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>;
const HeartIcon = () => <svg className="w-16 h-16 text-white drop-shadow-md group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>;
const PlayIcon = () => <svg className="w-6 h-6 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>;
const LoadingSpinner = () => <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>;
const FolderIcon = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>;

// --- GENERADOR DE MOSAICOS 2x2 ---
const MosaicCover = ({ songs }) => {
  if (!songs || songs.length === 0) {
    return (
      <div className="w-full h-full bg-[#111214] flex items-center justify-center text-gray-600">
        <MusicNoteIcon />
      </div>
    );
  }

  const uniqueCovers = [];
  const seenIds = new Set();
  for (const song of songs) {
    if (!seenIds.has(song.videoId) && song.thumbnail && !song.thumbnail.includes('ui-avatars') && !song.thumbnail.includes('Q2v1vV7.png')) {
      seenIds.add(song.videoId);
      uniqueCovers.push(song.thumbnail);
    }
  }

  if (uniqueCovers.length === 0) {
    return (
      <div className="w-full h-full bg-[#111214] flex items-center justify-center text-gray-600">
        <MusicNoteIcon />
      </div>
    );
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
  const { t } = useLanguage();
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
        const cleanResults = data.results.map(track => ({
          title: track.trackName,
          artist: track.artistName,
          videoId: `itunes_${track.trackId}`,
          thumbnail: track.artworkUrl100.replace('100x100bb', '600x600bb'),
          url: track.trackViewUrl
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
    if (!importUrl.trim()) return alert("Pega un enlace de Spotify o Tidal.");
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
      <section className="flex-1 flex flex-col overflow-y-auto custom-scrollbar bg-transparent pb-32 pt-10">
        <div className="max-w-[1200px] w-full mx-auto px-6 md:px-10 flex flex-col gap-10">
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div>
              <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter drop-shadow-lg mb-2">{t('playlists.title')}</h1>
              <p className="text-gray-400 font-medium">{t('playlists.subtitle')}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <button onClick={() => setIsModalOpen(true)} className="group relative glass-panel p-6 rounded-2xl flex items-center gap-4 hover:border-[#a855f7]/50 transition-all text-left overflow-hidden shadow-lg">
                  <div className="absolute inset-0 bg-gradient-to-r from-[#a855f7]/0 to-[#a855f7]/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[#a855f7] group-hover:scale-110 transition-transform shadow-inner">
                      <PlusIcon />
                  </div>
                  <div className="flex flex-col z-10">
                      <span className="text-lg font-bold text-white group-hover:text-[#a855f7] transition-colors">{t('playlists.create')}</span>
                      <span className="text-xs text-gray-500">{t('playlists.createDesc')}</span>
                  </div>
              </button>

              <button onClick={() => setIsImportModalOpen(true)} className="group relative glass-panel p-6 rounded-2xl flex items-center gap-4 hover:border-[#7e22ce]/50 transition-all text-left overflow-hidden shadow-lg">
                  <div className="absolute inset-0 bg-gradient-to-r from-[#7e22ce]/0 to-[#7e22ce]/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[#7e22ce] group-hover:scale-110 transition-transform shadow-inner">
                      <ImportIcon />
                  </div>
                  <div className="flex flex-col z-10">
                      <span className="text-lg font-bold text-white group-hover:text-[#7e22ce] transition-colors">{t('playlists.import')}</span>
                      <span className="text-xs text-gray-500">{t('playlists.importDesc')}</span>
                  </div>
              </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            
            {/* TARJETA DE ME GUSTA */}
            <Link href="/playlists/likes" className="group glass-panel rounded-2xl overflow-hidden hover:-translate-y-2 hover:shadow-[0_15px_30px_rgba(236,72,153,0.2)] transition-all duration-300 border hover:border-[#7e22ce]/50">
              <div className="aspect-square bg-gradient-to-br from-[#a855f7] to-[#7e22ce] flex items-center justify-center p-8 relative overflow-hidden">
                  <HeartIcon />
              </div>
              <div className="p-4 bg-black/40 backdrop-blur-md">
                <h3 className="font-bold text-white text-sm truncate group-hover:text-[#7e22ce] transition-colors">{t('playlists.likesTitle')}</h3>
                <p className="text-xs text-gray-400 mt-1">{t('playlists.autoList')}</p>
              </div>
            </Link>

            {/* MAPEO DE PLAYLISTS */}
            {playlists.map(pl => (
              <Link href={`/playlists/${pl.id}`} key={pl.id} className="group glass-panel rounded-2xl overflow-hidden hover:-translate-y-2 hover:shadow-[0_15px_30px_rgba(168,85,247,0.2)] transition-all duration-300 border hover:border-[#a855f7]/50">
                <div className="relative rounded-t-2xl overflow-hidden aspect-square bg-[#111214] border-b border-white/5">
                  <MosaicCover songs={pl.songs} />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 flex items-end justify-end p-3 z-20">
                      <button className="w-12 h-12 bg-gradient-to-r from-[#a855f7] to-[#7e22ce] rounded-full flex items-center justify-center text-white opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 hover:scale-105 hover:brightness-110 shadow-[0_0_15px_rgba(168,85,247,0.5)]">
                          <PlayIcon />
                      </button>
                  </div>
                </div>
                <div className="p-4 bg-black/40 backdrop-blur-md">
                  <h3 className="font-bold text-white text-sm truncate mb-1 group-hover:text-[#a855f7] transition-colors">{pl.name}</h3>
                  <p className="text-xs text-gray-500 font-medium truncate">
                    {pl.songs?.length || 0} {t('playlists.songs')} • {pl.is_public ? t('playlists.public') : t('playlists.private')}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* VENTANA MODAL (CREAR PLAYLIST) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="glass-panel rounded-3xl p-8 w-full max-w-md shadow-2xl border border-[#a855f7]/30 animate-slideUp">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black text-white">{t('playlists.create')}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-white text-2xl leading-none">×</button>
            </div>

            <div className="flex flex-col gap-6">
              <div>
                <input 
                  type="text" 
                  autoFocus
                  placeholder="Ej: Cyberpunk Vibes..." 
                  className="w-full bg-white/5 border border-white/10 focus:border-[#a855f7] text-white rounded-xl p-4 outline-none font-bold transition shadow-inner"
                  value={plName}
                  onChange={(e) => setPlName(e.target.value)}
                />
              </div>

              <div>
                <form onSubmit={handleSearch} className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Busca un artista o tema..." 
                    className="flex-1 bg-white/5 border border-white/10 focus:border-[#a855f7] text-white rounded-xl p-3 outline-none text-sm transition shadow-inner"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <button type="submit" disabled={isSearching} className="bg-white/10 hover:bg-white/20 text-white px-4 rounded-xl font-bold transition border border-white/5 hover:border-white/10 flex items-center justify-center min-w-[80px]">
                    {isSearching ? <LoadingSpinner /> : t('search.btn')}
                  </button>
                </form>

                {searchResults.length > 0 && (
                  <div className="mt-4 flex flex-col gap-2 max-h-48 overflow-y-auto custom-scrollbar pr-2">
                    {searchResults.map((track, i) => (
                      <div 
                        key={i} 
                        onClick={() => setSelectedSong(track)}
                        className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer transition border ${selectedSong?.videoId === track.videoId ? 'border-[#a855f7] bg-[#a855f7]/10 shadow-[0_0_15px_rgba(168,85,247,0.2)]' : 'border-transparent hover:bg-white/5'}`}
                      >
                        <img src={track.thumbnail} className="w-10 h-10 rounded object-cover" alt="Cover" />
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className="text-sm font-bold text-white truncate">{track.title}</span>
                          <span className="text-[10px] text-[#a855f7] font-bold uppercase truncate">{track.artist}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8">
              <button onClick={() => setIsModalOpen(false)} className="px-5 py-3 rounded-full font-bold text-sm text-gray-400 hover:text-white transition">{t('common.cancel')}</button>
              <button onClick={handleCreate} disabled={isSaving || !plName.trim()} className="px-6 py-3 rounded-full font-bold text-sm bg-gradient-to-r from-[#a855f7] to-[#7e22ce] text-white transition disabled:opacity-50 shadow-[0_0_15px_rgba(168,85,247,0.4)] hover:brightness-110 flex items-center gap-2">
                {isSaving ? <LoadingSpinner /> : t('common.save')}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* VENTANA MODAL (IMPORTAR EXTERNA) */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="glass-panel rounded-3xl p-8 w-full max-w-lg shadow-[0_0_50px_rgba(236,72,153,0.15)] border border-[#7e22ce]/30 animate-slideUp">
            
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-2xl font-black text-white flex items-center gap-3">
                <ImportIcon />
                {t('playlists.import')}
              </h2>
              <button onClick={() => setIsImportModalOpen(false)} className="text-gray-500 hover:text-white text-2xl leading-none">×</button>
            </div>
            
            <p className="text-xs text-gray-400 mb-6 font-medium">{t('playlists.importDesc')}</p>

            <div className="flex flex-col gap-6">
              <div>
                <input 
                  type="url" 
                  autoFocus
                  placeholder="https://open.spotify.com/playlist/..." 
                  className="w-full bg-white/5 border border-white/10 focus:border-[#7e22ce] text-white rounded-xl p-4 outline-none font-bold transition shadow-inner"
                  value={importUrl}
                  onChange={(e) => setImportUrl(e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8">
              <button onClick={() => setIsImportModalOpen(false)} className="px-5 py-3 rounded-full font-bold text-sm text-gray-400 hover:text-white transition">{t('common.cancel')}</button>
              <button onClick={handleImport} disabled={isImporting || !importUrl.trim()} className="flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm bg-gradient-to-r from-[#7e22ce] to-[#a855f7] text-white transition disabled:opacity-50 shadow-[0_0_15px_rgba(236,72,153,0.4)] hover:brightness-110">
                {isImporting ? <LoadingSpinner /> : t('playlists.import')}
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}