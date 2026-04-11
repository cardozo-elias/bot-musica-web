"use client";
import React, { useState, useEffect } from 'react';
import { io } from "socket.io-client";
import { useRouter } from 'next/navigation';

export default function SearchClient({ initialQuery, session }) {
  const [query, setQuery] = useState(initialQuery || "");
  const [results, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [socket, setSocket] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const botUrl = process.env.NEXT_PUBLIC_BOT_URL || "http://localhost:3001";
    const newSocket = io(botUrl, { extraHeaders: { "ngrok-skip-browser-warning": "true" } });
    setSocket(newSocket);
    if (initialQuery) performSearch(initialQuery);
    return () => newSocket.disconnect();
  }, [initialQuery]);

  const performSearch = async (searchTerm) => {
    if (!searchTerm.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(searchTerm)}&entity=song&limit=12`);
      const data = await res.json();
      if (data.results) {
        setSearchResults(data.results.map(t => ({
          title: t.trackName,
          artist: t.artistName,
          thumbnail: t.artworkUrl100.replace('100x100bb', '600x600bb'),
          videoId: `itunes_${t.trackId}`, // ID falso para UI
          queryStr: `${t.trackName} ${t.artistName}` // Lo que le pasaremos al bot
        })));
      }
    } catch (err) { console.error(err); }
    setIsSearching(false);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    router.push(`/search?q=${encodeURIComponent(query)}`);
    performSearch(query);
  };

  const handlePlay = (track) => {
    if (!socket) return;
    socket.emit("cmd_play", {
      userId: session.user.id,
      userName: session.user.name,
      userAvatar: session.user.image,
      query: track.queryStr // El bot buscará esto en YouTube automáticamente
    });
  };

  return (
    <section className="flex-1 flex flex-col overflow-y-auto custom-scrollbar bg-transparent pb-32 pt-10">
      <div className="max-w-[1200px] w-full mx-auto px-6 md:px-10 flex flex-col gap-10">
        
        <div>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-4">Buscador Global</h1>
          
          <form onSubmit={handleSearchSubmit} className="relative group max-w-2xl">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-[#a855f7] transition-colors">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            <input 
              type="text" 
              autoFocus
              className="w-full glass-panel border border-white/10 text-white rounded-2xl py-4 pl-12 pr-32 outline-none font-bold text-lg focus:border-[#a855f7]/50 shadow-inner transition-all focus:bg-white/5"
              placeholder="¿Qué quieres escuchar hoy?"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button type="submit" disabled={isSearching} className="absolute inset-y-2 right-2 bg-gradient-to-r from-[#a855f7] to-[#7e22ce] text-white font-bold px-6 rounded-xl transition hover:brightness-110 disabled:opacity-50">
              {isSearching ? '...' : 'Buscar'}
            </button>
          </form>
        </div>

        {results.length > 0 && (
          <div className="flex flex-col gap-4">
            <h2 className="text-sm font-black uppercase text-gray-500 tracking-widest">Resultados para "{query}"</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {results.map((track, i) => (
                <div key={i} className="glass-panel border border-white/5 hover:border-[#a855f7]/50 rounded-2xl p-3 flex items-center gap-4 group transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_20px_rgba(168,85,247,0.15)]">
                  <div className="relative w-16 h-16 shrink-0 rounded-xl overflow-hidden shadow-md">
                    <img src={track.thumbnail} alt="Cover" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button onClick={() => handlePlay(track)} className="w-10 h-10 bg-[#a855f7] rounded-full flex items-center justify-center text-white shadow-lg hover:scale-110 transition-transform">
                         <svg className="w-5 h-5 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-base font-bold text-white truncate">{track.title}</span>
                    <span className="text-[11px] font-medium uppercase tracking-widest text-[#a855f7] truncate">{track.artist}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!isSearching && results.length === 0 && query && (
           <p className="text-gray-500 font-medium text-center py-10">No encontramos resultados para "{query}". Prueba con otro término.</p>
        )}

      </div>
    </section>
  );
}