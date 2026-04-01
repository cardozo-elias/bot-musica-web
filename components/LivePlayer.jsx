"use client";
import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";

const formatTime = (ms) => {
  const totalSeconds = Math.floor((ms || 0) / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

// Íconos SVG limpios
const PlayIcon = () => <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>;
const PauseIcon = () => <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>;
const SkipIcon = () => <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z"/></svg>;
const HeartIcon = ({ filled }) => (
  <svg className="w-5 h-5 transition-colors" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={filled ? "0" : "2"} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
  </svg>
);
const ListIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16m-7 6h7" /></svg>;
const MenuIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const LyricsIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;

export default function LivePlayer({ userId, guildId }) {
  const [status, setStatus] = useState({ playing: false, queueList: [] });
  const [isLiked, setIsLiked] = useState(false); 
  const [currentVideoId, setCurrentVideoId] = useState(null); 
  const [playlists, setPlaylists] = useState([]);
  const [showPlaylistMenu, setShowPlaylistMenu] = useState(false);
  const [showQueue, setShowQueue] = useState(false); 
  const [showLyrics, setShowLyrics] = useState(false);
  const [lyrics, setLyrics] = useState({ title: "", text: "", loading: false });
  
  // --- NUEVOS ESTADOS PARA LA NOTIFICACIÓN ---
  const [toastMsg, setToastMsg] = useState(null);
  const [isQueueBouncing, setIsQueueBouncing] = useState(false);
  
  const [draggingIndex, setDraggingIndex] = useState(null);
  const [localQueue, setLocalQueue] = useState([]);
  const isReordering = useRef(false);
  const lyricsScrollRef = useRef(null); 
  const socketRef = useRef(null);

  useEffect(() => {
    if (!userId) return;
    const botUrl = process.env.NEXT_PUBLIC_BOT_URL || "http://localhost:3001";
    
    socketRef.current = io(botUrl, { extraHeaders: { "ngrok-skip-browser-warning": "true" } });
    fetch('/api/playlists').then(res => res.json()).then(data => { if (Array.isArray(data)) setPlaylists(data); });

    const interval = setInterval(() => {
      if (!isReordering.current) socketRef.current?.emit("get_status", { userId, guildId });
    }, 1000);
    
    socketRef.current.on("sync_status", (data) => {
      if (isReordering.current) return;
      setStatus(data);
      if (data.playing && data.song) {
        document.title = data.isPaused ? `|| ${data.song.title}` : `Playing: ${data.song.title}`;
        if (draggingIndex === null) setLocalQueue(data.queueList || []);
        if (data.song.videoId !== currentVideoId) { setCurrentVideoId(data.song.videoId); setIsLiked(false); }
      } else { 
        document.title = "Musicardi Panel";
      }
    });

    socketRef.current.on("lyrics_data", (data) => setLyrics({ title: data.title || "", text: data.lyrics || data.error, loading: false }));
    
    // --- ESCUCHADOR DE NOTIFICACIONES ---
    socketRef.current.on("track_added", (title) => {
      setToastMsg(title);
      setIsQueueBouncing(true);
      setTimeout(() => setIsQueueBouncing(false), 500); // Salto rápido del botón
      setTimeout(() => setToastMsg(null), 3500); // Ocultar mensaje después de 3.5s
    });

    return () => { clearInterval(interval); socketRef.current?.disconnect(); };
  }, [userId, guildId]);

  useEffect(() => { if (showLyrics && currentVideoId) fetchLyrics(); }, [currentVideoId, showLyrics]);

  useEffect(() => {
    if (showLyrics && lyricsScrollRef.current && status.song?.durationSec > 0 && !status.isPaused) {
      const container = lyricsScrollRef.current;
      const progress = (status.currentMs / 1000) / status.song.durationSec;
      const maxScroll = container.scrollHeight - container.clientHeight;
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
    setDraggingIndex(null); setTimeout(() => { isReordering.current = false; }, 1500);
  };

  const handleLike = () => { socketRef.current?.emit("cmd_like", userId); setIsLiked(true); };
  const handlePause = () => socketRef.current?.emit("cmd_pause", userId);
  const handleSkip = () => socketRef.current?.emit("cmd_skip", userId);
  const saveToPlaylist = async (playlistId) => {
    const res = await fetch('/api/playlists', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ playlistId, song: status.song }) });
    if (res.ok) { setShowPlaylistMenu(false); alert("Guardada."); }
  };

  const progressPercent = status.song?.durationSec > 0 ? (status.currentMs / (status.song.durationSec * 1000)) * 100 : 0;

  if (!status.playing || !status.song) {
    return (
      <div className="fixed bottom-0 left-0 w-full bg-[#111214] border-t border-[#1e1f22] p-4 z-[60] flex items-center justify-between px-6 md:px-10 h-[90px] shadow-2xl">
        <div className="flex items-center gap-4 opacity-40 w-1/4">
          <div className="w-14 h-14 bg-[#1e1f22] rounded-md border border-[#2b2d31]"></div>
          <div className="flex flex-col gap-2">
            <div className="w-24 h-2.5 bg-[#1e1f22] rounded-sm"></div>
            <div className="w-16 h-2 bg-[#1e1f22] rounded-sm"></div>
          </div>
        </div>
        <div className="flex w-2/4 flex-col items-center opacity-40">
          <div className="flex items-center gap-6 mb-2">
            <div className="w-5 h-5 bg-[#1e1f22] rounded-full"></div>
            <div className="w-10 h-10 bg-[#2b2d31] rounded-full"></div>
            <div className="w-5 h-5 bg-[#1e1f22] rounded-full"></div>
          </div>
          <div className="w-full max-w-2xl bg-[#1e1f22] rounded-full h-1"></div>
        </div>
        <div className="w-1/4 flex justify-end"></div>
      </div>
    );
  }

  return (
    <>
      {/* NOTIFICACIÓN FLOTANTE */}
      {toastMsg && (
        <div className="fixed bottom-[110px] right-6 md:right-10 bg-[#57F287] text-[#0a0a0c] px-4 py-3 rounded-xl shadow-[0_10px_40px_rgba(87,242,135,0.3)] font-bold text-sm z-[100] flex items-center gap-3 transition-all animate-bounce">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
          <span className="truncate max-w-[200px]">{toastMsg}</span>
          <span className="opacity-70 text-[10px] uppercase tracking-widest ml-1 hidden md:inline">A la cola</span>
        </div>
      )}

      {showLyrics && (
        <div className="fixed inset-0 bg-[#0a0a0c]/90 z-[100] p-4 flex items-center justify-center animate-fadeIn backdrop-blur-sm">
          <div className="bg-[#111214] border border-[#1e1f22] rounded-xl shadow-2xl w-full max-w-2xl h-[80vh] flex flex-col overflow-hidden relative">
            <div className="p-6 border-b border-[#1e1f22] flex justify-between items-center bg-[#111214] shrink-0 z-10">
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-white truncate">{status.song.title}</h2>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">{String(status.song.artist)}</p>
              </div>
              <button onClick={() => setShowLyrics(false)} className="text-gray-500 hover:text-white transition text-sm font-bold uppercase tracking-widest">Cerrar</button>
            </div>
            <div ref={lyricsScrollRef} className="p-8 overflow-y-auto custom-scrollbar flex-1 relative scroll-smooth">
              {lyrics.loading ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                    <p className="text-sm font-bold animate-pulse text-gray-500 uppercase tracking-widest">Sincronizando...</p>
                </div>
              ) : (
                <pre className="text-base text-gray-300 whitespace-pre-wrap font-sans leading-relaxed text-center pb-[50vh]">
                  {lyrics.text || "Letra no encontrada."}
                </pre>
              )}
            </div>
          </div>
        </div>
      )}

      {showQueue && (
        <div className="fixed right-6 top-6 bottom-[110px] w-[380px] bg-[#111214] border border-[#1e1f22] z-[40] shadow-2xl rounded-xl p-6 flex flex-col animate-slideInRight">
          <div className="flex justify-between items-center mb-6 border-b border-[#1e1f22] pb-4">
            <h3 className="font-bold uppercase text-xs tracking-widest text-gray-400">Cola de Reproducción</h3>
            <button onClick={() => setShowQueue(false)} className="text-gray-500 hover:text-white text-xl">&times;</button>
          </div>
          <div className="flex flex-col gap-2 overflow-y-auto pr-2 custom-scrollbar">
            {localQueue.length > 0 ? localQueue.map((s, i) => (
              <div key={`${s.videoId}-${i}`} draggable onDragStart={(e)=>handleDragStart(e,i)} onDragOver={(e)=>handleDragOver(e,i)} onDragEnd={handleDragEnd}
                className={`flex items-center gap-4 p-2.5 rounded-lg border transition-all cursor-grab active:cursor-grabbing ${draggingIndex === i ? 'opacity-30 border-[#5865F2] bg-[#1e1f22]' : 'border-transparent hover:bg-[#1e1f22]'}`}>
                <img src={s.thumbnail} className="w-10 h-10 rounded-md object-cover flex-shrink-0" alt="" />
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-sm font-bold text-gray-200 truncate">{s.title}</span>
                  <span className="text-[10px] text-gray-500 font-bold uppercase truncate">{String(s.artist)}</span>
                </div>
              </div>
            )) : <p className="text-gray-600 text-xs italic text-center py-4">No hay más pistas.</p>}
          </div>
        </div>
      )}

      <div className="fixed bottom-0 left-0 w-full bg-[#111214] border-t border-[#1e1f22] p-4 shadow-[0_-10px_40px_rgba(0,0,0,0.4)] z-[60] flex flex-col md:flex-row items-center justify-between px-6 md:px-10 h-[90px]">
        <div className="flex items-center justify-start w-1/4 gap-4 overflow-hidden">
          <img src={status.song.thumbnail} alt="Cover" className="w-14 h-14 rounded-md shadow-md border border-[#2b2d31] flex-shrink-0 object-cover" />
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-gray-100 text-sm line-clamp-1 hover:text-white transition" title={status.song.title}>
              {status.song.isTrivia ? "Pista Misteriosa" : status.song.title}
            </span>
            <span className="text-gray-500 text-[10px] font-bold uppercase tracking-widest truncate mt-0.5">
              {status.song.isTrivia ? "???" : (status.song.artist || "Desconocido")}
            </span>
          </div>
        </div>

        <div className="flex w-2/4 flex-col items-center">
          <div className="hidden md:flex items-center gap-6 mb-1 relative">
            <button onClick={handleLike} disabled={isLiked} className={`${isLiked ? 'text-white' : 'text-gray-500 hover:text-gray-300'} transition transform hover:scale-110 active:scale-95`} title="Guardar pista">
              <HeartIcon filled={isLiked} />
            </button>
            <div className="relative">
              <button onClick={() => setShowPlaylistMenu(!showPlaylistMenu)} className="text-gray-500 hover:text-gray-300 transition transform hover:scale-110" title="Añadir a Playlist">
                <MenuIcon />
              </button>
              {showPlaylistMenu && (
                <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-48 bg-[#18191c] border border-[#2b2d31] rounded-lg shadow-2xl p-1.5 z-[60] animate-fadeIn">
                  <p className="text-[9px] font-bold uppercase text-gray-500 mb-1.5 px-3 pt-1 text-center border-b border-[#2b2d31] pb-1.5 tracking-widest">Añadir a</p>
                  <div className="max-h-48 overflow-y-auto custom-scrollbar">
                    {playlists.map(pl => (
                      <button key={pl.id} onClick={() => saveToPlaylist(pl.id)} className="w-full text-left text-[11px] p-2 hover:bg-[#2b2d31] rounded-md transition truncate font-bold text-gray-300">{pl.name}</button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <button onClick={handlePause} className="text-gray-300 hover:text-white transition transform hover:scale-110 p-2" title={status.isPaused ? "Reanudar" : "Pausar"}>
              {status.isPaused ? <PlayIcon /> : <PauseIcon />}
            </button>
            <button onClick={handleSkip} className="text-gray-500 hover:text-gray-300 transition transform hover:scale-110" title="Omitir">
              <SkipIcon />
            </button>
          </div>

          <div className="w-full max-w-2xl flex items-center gap-3 px-2">
            <span className="text-[10px] text-gray-500 font-mono w-10 text-right">{formatTime(status.currentMs)}</span>
            <div onClick={(e) => {
              const bar = e.currentTarget; const rect = bar.getBoundingClientRect();
              const percent = (e.clientX - rect.left) / rect.width;
              socketRef.current?.emit("cmd_seek", { userId, targetSec: Math.floor(percent * status.song.durationSec) });
            }} className="flex-1 bg-[#2b2d31] rounded-full h-1 relative overflow-hidden cursor-pointer group hover:h-1.5 transition-all">
              <div className="bg-white h-full transition-all duration-500 rounded-r-full" style={{ width: `${progressPercent}%` }} />
            </div>
            <span className="text-[10px] text-gray-500 font-mono w-10">{formatTime(status.song.durationSec * 1000)}</span>
          </div>
        </div>

        <div className="hidden md:flex w-1/4 justify-end gap-5 items-center">
          <button onClick={() => setShowLyrics(!showLyrics)} className={`${showLyrics ? 'text-white' : 'text-gray-500'} hover:text-gray-300 transition`} title="Letra">
             <LyricsIcon />
          </button>
          
          {/* BOTÓN COLA CON ANIMACIÓN */}
          <button onClick={() => setShowQueue(!showQueue)} 
            className={`${showQueue ? 'text-white' : 'text-gray-500'} ${isQueueBouncing ? 'scale-125 text-[#57F287] -translate-y-2' : 'hover:text-gray-300'} transition-all duration-300 transform`} 
            title="Cola">
             <ListIcon />
          </button>
        </div>
      </div>
    </>
  );
}