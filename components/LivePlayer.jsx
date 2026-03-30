"use client";
import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";

const formatTime = (ms) => {
  const totalSeconds = Math.floor((ms || 0) / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

export default function LivePlayer({ userId }) {
  const [status, setStatus] = useState({ playing: false, queueList: [] });
  const [isLiked, setIsLiked] = useState(false); 
  const [currentVideoId, setCurrentVideoId] = useState(null); 
  const [playlists, setPlaylists] = useState([]);
  const [showPlaylistMenu, setShowPlaylistMenu] = useState(false);
  const [showQueue, setShowQueue] = useState(true); 
  const [showLyrics, setShowLyrics] = useState(false);
  const [lyrics, setLyrics] = useState({ title: "", text: "", loading: false });
  
  const [draggingIndex, setDraggingIndex] = useState(null);
  const [localQueue, setLocalQueue] = useState([]);
  const isReordering = useRef(false);
  const lyricsScrollRef = useRef(null); // NUEVO: Ref para el auto-scroll de las letras

  const socketRef = useRef(null);

  useEffect(() => {
    if (!userId) return;
    socketRef.current = io("http://localhost:3001");
    
    fetch('/api/playlists').then(res => res.json()).then(data => { if (Array.isArray(data)) setPlaylists(data); });

    const interval = setInterval(() => {
      if (!isReordering.current) socketRef.current?.emit("get_status", userId);
    }, 1000);
    
    socketRef.current.on("sync_status", (data) => {
      if (isReordering.current) return;
      setStatus(data);
      if (data.song) {
        document.title = data.isPaused ? `⏸️ ${data.song.title}` : `▶️ ${data.song.title}`;
        if (draggingIndex === null) setLocalQueue(data.queueList || []);
        if (data.song.videoId !== currentVideoId) {
          setCurrentVideoId(data.song.videoId); setIsLiked(false);
        }
      } else { document.title = "Musicardi Panel"; }
    });

    socketRef.current.on("lyrics_data", (data) => {
      setLyrics({ title: data.title || "", text: data.lyrics || data.error, loading: false });
    });

    return () => { clearInterval(interval); socketRef.current?.disconnect(); };
  }, [userId, draggingIndex, currentVideoId]);

  useEffect(() => { if (showLyrics && currentVideoId) fetchLyrics(); }, [currentVideoId, showLyrics]);

  // NUEVO: Auto-scroll de letras basado en el progreso
  useEffect(() => {
    if (showLyrics && lyricsScrollRef.current && status.song?.durationSec > 0 && !status.isPaused) {
      const container = lyricsScrollRef.current;
      const progress = (status.currentMs / 1000) / status.song.durationSec;
      const maxScroll = container.scrollHeight - container.clientHeight;
      // Scrollea suavemente en base al porcentaje de la canción
      container.scrollTop = maxScroll * progress;
    }
  }, [status.currentMs, showLyrics, status.song]);

  const fetchLyrics = () => { setLyrics(prev => ({ ...prev, loading: true })); socketRef.current?.emit("get_lyrics", userId); };

  const handleDragStart = (e, i) => { isReordering.current = true; setDraggingIndex(i); e.dataTransfer.effectAllowed = "move"; };
  const handleDragOver = (e, i) => {
    e.preventDefault();
    if (draggingIndex === null || draggingIndex === i) return;
    const reordered = [...localQueue];
    const item = reordered.splice(draggingIndex, 1)[0];
    reordered.splice(i, 0, item);
    setDraggingIndex(i); setLocalQueue(reordered);
  };
  const handleDragEnd = () => {
    socketRef.current?.emit("cmd_reorder_queue", { userId, newQueueIds: localQueue.map(s => s.videoId) });
    setDraggingIndex(null);
    setTimeout(() => { isReordering.current = false; }, 1500);
  };

  const handleLike = () => { socketRef.current?.emit("cmd_like", userId); setIsLiked(true); };
  const handlePause = () => socketRef.current?.emit("cmd_pause", userId);
  const handleSkip = () => socketRef.current?.emit("cmd_skip", userId);
  const saveToPlaylist = async (playlistId) => {
    const res = await fetch('/api/playlists', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ playlistId, song: status.song }) });
    if (res.ok) { setShowPlaylistMenu(false); alert("✅ Guardada."); }
  };

  if (!status.playing || !status.song) return null;
  const progressPercent = status.song.durationSec > 0 ? (status.currentMs / (status.song.durationSec * 1000)) * 100 : 0;

  return (
    <>
      {/* NUEVO DISEÑO DE LETRAS: Modal limpio, sin verde flúor, con auto-scroll */}
      {showLyrics && (
        <div className="fixed inset-0 bg-[#0a0a0c]/80 z-[100] p-4 md:p-10 flex items-center justify-center animate-fadeIn backdrop-blur-sm">
          <div className="bg-[#111214] border border-[#2b2d31] rounded-3xl shadow-2xl w-full max-w-2xl h-[80vh] flex flex-col overflow-hidden relative">
            <div className="p-6 border-b border-[#2b2d31] flex justify-between items-center bg-[#161719] shrink-0 z-10 shadow-md">
              <div className="min-w-0">
                <h2 className="text-xl font-black text-white truncate">{status.song.title}</h2>
                <p className="text-xs text-[#57F287] font-bold uppercase tracking-widest">{String(status.song.artist)}</p>
              </div>
              <button onClick={() => setShowLyrics(false)} className="text-gray-500 hover:text-white bg-[#2b2d31] hover:bg-[#3f4147] p-2 rounded-xl transition">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div ref={lyricsScrollRef} className="p-8 overflow-y-auto custom-scrollbar flex-1 relative scroll-smooth">
              {lyrics.loading ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                    <p className="text-lg font-bold animate-pulse text-gray-400 uppercase tracking-widest">Sincronizando Letras...</p>
                </div>
              ) : (
                <pre className="text-base md:text-lg text-gray-300 whitespace-pre-wrap font-sans leading-relaxed text-center pb-[50vh]">
                  {lyrics.text || "Letra no encontrada."}
                </pre>
              )}
            </div>
          </div>
        </div>
      )}

      {showQueue && (
        <div className="fixed right-6 top-6 bottom-32 w-[380px] bg-[#111214] border border-[#2b2d31] z-[40] shadow-2xl rounded-3xl p-6 flex flex-col animate-slideInRight">
          <div className="flex justify-between items-center mb-6 border-b border-[#2b2d31] pb-4">
            <h3 className="font-black uppercase text-[10px] tracking-widest text-gray-500">Cola de Reproducción</h3>
            <button onClick={() => setShowQueue(false)} className="text-gray-500 hover:text-white text-xl">&times;</button>
          </div>
          <div className="flex flex-col gap-3 overflow-y-auto pr-2 custom-scrollbar">
            {localQueue.length > 0 ? localQueue.map((s, i) => (
              <div key={`${s.videoId}-${i}`} draggable onDragStart={(e)=>handleDragStart(e,i)} onDragOver={(e)=>handleDragOver(e,i)} onDragEnd={handleDragEnd}
                className={`flex items-center gap-4 p-3 rounded-2xl border transition-all cursor-grab active:cursor-grabbing ${draggingIndex === i ? 'opacity-30 border-[#5865F2] bg-[#1e1f22]' : 'border-transparent hover:bg-[#1e1f22]'}`}>
                <img src={s.thumbnail} className="w-14 h-14 rounded-xl object-cover shadow-xl flex-shrink-0" alt="" />
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-sm font-bold text-white truncate">{s.title}</span>
                  <span className="text-[10px] text-gray-500 font-bold uppercase truncate">{String(s.artist)}</span>
                </div>
              </div>
            )) : <p className="text-gray-600 text-xs italic text-center py-4">No hay más temas en la cola.</p>}
          </div>
        </div>
      )}

      <div className="fixed bottom-0 left-0 w-full bg-[#0a0a0c]/95 backdrop-blur-xl border-t border-[#2b2d31] p-4 shadow-2xl z-50 flex flex-col md:flex-row items-center justify-between px-10 gap-2 md:gap-0">
        <div className="flex items-center justify-start w-1/4 gap-4 overflow-hidden">
          <img src={status.song.thumbnail} alt="Cover" className="w-14 h-14 rounded-xl shadow-2xl border border-[#2b2d31] flex-shrink-0" />
          <div className="flex flex-col min-w-0">
            <span className="font-black text-white text-base line-clamp-1 hover:text-[#57F287] transition cursor-help" title={status.song.title}>
              {status.song.isTrivia ? "❓ Pista Misteriosa" : status.song.title}
            </span>
            <span className="text-[#57F287] text-[10px] font-black uppercase tracking-widest truncate">
              {status.song.isTrivia ? "???" : (status.song.artist || "Artista Desconocido")}
            </span>
          </div>
        </div>

        <div className="flex w-2/4 flex-col items-center">
          <div className="hidden md:flex items-center gap-8 mb-2 relative">
            <button onClick={handleLike} disabled={isLiked} className={`${isLiked ? 'text-[#57F287]' : 'text-gray-400 hover:text-white'} transition transform hover:scale-125 active:scale-95`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill={isLiked ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
            </button>
            <div className="relative">
              <button onClick={() => setShowPlaylistMenu(!showPlaylistMenu)} className="text-gray-400 hover:text-[#5865F2] transition transform hover:scale-125">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </button>
              {showPlaylistMenu && (
                <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-56 bg-[#111214] border border-[#2b2d31] rounded-2xl shadow-2xl p-2 z-[60] animate-fadeIn">
                  <p className="text-[10px] font-black uppercase text-gray-600 mb-2 px-3 pt-1 text-center border-b border-[#2b2d31] pb-2 tracking-widest">Guardar canción en:</p>
                  <div className="max-h-48 overflow-y-auto custom-scrollbar">
                    {playlists.map(pl => (
                      <button key={pl.id} onClick={() => saveToPlaylist(pl.id)} className="w-full text-left text-[11px] p-2.5 hover:bg-[#5865F2] rounded-lg transition truncate font-black text-gray-300 uppercase">📁 {pl.name}</button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <button onClick={handlePause} className="bg-white text-black rounded-full p-2.5 hover:scale-110 transition shadow-[0_0_15px_rgba(255,255,255,0.2)]">
              {status.isPaused ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
              )}
            </button>
            <button onClick={handleSkip} className="text-gray-500 hover:text-white transition transform hover:translate-x-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11.933 12.8a1 1 0 000-1.6L6.6 7.2A1 1 0 005 8v8a1 1 0 001.6.8l5.333-4zM19.933 12.8a1 1 0 000-1.6l-5.333-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.333-4z" /></svg>
            </button>
          </div>

          <div className="w-full max-w-2xl flex items-center gap-3 px-2">
            <span className="text-[10px] text-gray-500 font-mono w-10 text-right">{formatTime(status.currentMs)}</span>
            <div onClick={(e) => {
              const bar = e.currentTarget; const rect = bar.getBoundingClientRect();
              const percent = (e.clientX - rect.left) / rect.width;
              socketRef.current?.emit("cmd_seek", { userId, targetSec: Math.floor(percent * status.song.durationSec) });
            }} className="flex-1 bg-[#2b2d31] rounded-full h-1.5 relative overflow-hidden cursor-pointer group">
              <div className="bg-gradient-to-r from-[#5865F2] to-[#57F287] h-full transition-all duration-500" style={{ width: `${progressPercent}%` }} />
            </div>
            <span className="text-[10px] text-gray-500 font-mono w-10">{formatTime(status.song.durationSec * 1000)}</span>
          </div>
        </div>

        <div className="hidden md:flex w-1/4 justify-end gap-6 items-center">
          <button onClick={() => setShowLyrics(!showLyrics)} className={`${showLyrics ? 'text-[#57F287]' : 'text-gray-500'} hover:text-white transition scale-110`}>
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          </button>
          <button onClick={() => setShowQueue(!showQueue)} className={`${showQueue ? 'text-[#5865F2]' : 'text-gray-500'} hover:text-white transition scale-110`}>
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16m-7 6h7" /></svg>
          </button>
          <div className="text-right border-l border-[#2b2d31] pl-6 min-w-[120px]">
            <span className="text-[10px] text-[#5865F2] font-black uppercase block tracking-tighter">{status.guildName}</span>
            <span className="text-[10px] text-gray-500 font-bold uppercase">{status.queueLength} EN COLA</span>
          </div>
        </div>
      </div>
    </>
  );
}