"use client";
import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";

const formatTime = (ms) => {
  const totalSeconds = Math.floor((ms || 0) / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

// ÍCONOS SVG
const PlayIcon = () => <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>;
const PauseIcon = () => <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>;
const SkipIcon = () => <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z"/></svg>;
const HeartIcon = ({ filled }) => <svg className="w-6 h-6 transition-colors" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={filled ? "0" : "2"} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>;
const ListIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16m-7 6h7" /></svg>;
const MenuIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const FullscreenIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>;
const ShrinkIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 14h4v4m0-4l-5 5m16-5h-4v4m0-4l5 5M4 10h4V6m0 4l-5-5m16 5h-4V6m0 4l5-5" /></svg>;
const FilterIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>;
const LyricsIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;


export default function LivePlayer({ userId, guildId }) {
  const [status, setStatus] = useState({ playing: false, queueList: [], color: '#57F287', voiceMembers: [], volume: 100 });
  const [isLiked, setIsLiked] = useState(false); 
  const [currentVideoId, setCurrentVideoId] = useState(null); 
  const [playlists, setPlaylists] = useState([]);
  
  // Menús Toggles
  const [showPlaylistMenu, setShowPlaylistMenu] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showQueue, setShowQueue] = useState(false); 
  const [showLyrics, setShowLyrics] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const [lyrics, setLyrics] = useState({ title: "", text: "", loading: false });
  const [toastMsg, setToastMsg] = useState(null);
  const [isQueueBouncing, setIsQueueBouncing] = useState(false);
  const [draggingIndex, setDraggingIndex] = useState(null);
  const [localQueue, setLocalQueue] = useState([]);
  
  const isReordering = useRef(false);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!userId) return;
    const botUrl = process.env.NEXT_PUBLIC_BOT_URL || "http://localhost:3001";
    socketRef.current = io(botUrl, { extraHeaders: { "ngrok-skip-browser-warning": "true" } });
    fetch('/api/playlists').then(res => res.json()).then(data => { if (Array.isArray(data)) setPlaylists(data); });

    const interval = setInterval(() => { if (!isReordering.current) socketRef.current?.emit("get_status", { userId, guildId }); }, 1000);
    
    socketRef.current.on("sync_status", (data) => {
      if (isReordering.current) return;
      setStatus(prev => ({ ...data, volume: data.volume || prev.volume, color: data.color || '#57F287', voiceMembers: data.voiceMembers || [] }));
      
      if (data.playing && data.song) {
        document.title = data.isPaused ? `|| ${data.song.title}` : `▶ ${data.song.title}`;
        if (draggingIndex === null) setLocalQueue(data.queueList || []);
        setCurrentVideoId(data.song.videoId);
        setIsLiked(data.isLiked); 
      } else { 
        document.title = "Musicardi Panel";
      }
    });

    socketRef.current.on("lyrics_data", (data) => setLyrics({ title: data.title || "", text: data.lyrics || data.error, loading: false }));
    socketRef.current.on("track_added", (title) => { 
        setToastMsg(title); 
        setIsQueueBouncing(true);
        setTimeout(() => setIsQueueBouncing(false), 500);
        setTimeout(() => setToastMsg(null), 3500); 
    });

    return () => { clearInterval(interval); socketRef.current?.disconnect(); };
  }, [userId, guildId]);

  useEffect(() => { if (showLyrics && currentVideoId) fetchLyrics(); }, [currentVideoId, showLyrics]);

  const fetchLyrics = () => { setLyrics(prev => ({ ...prev, loading: true })); socketRef.current?.emit("get_lyrics", userId); };
  
  // Lógica Drag & Drop
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
    socketRef.current?.emit("cmd_reorder_queue", { userId, guildId, newQueueIds: localQueue.map(s => s.videoId) });
    setDraggingIndex(null); 
    setTimeout(() => { isReordering.current = false; }, 500);
  };

  const handleLike = () => { socketRef.current?.emit("cmd_like", userId); setIsLiked(true); };
  const handlePause = () => socketRef.current?.emit("cmd_pause", userId);
  const handleSkip = () => socketRef.current?.emit("cmd_skip", userId);
  const saveToPlaylist = async (playlistId) => {
    const res = await fetch('/api/playlists', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ playlistId, song: status.song }) });
    if (res.ok) { setShowPlaylistMenu(false); alert("Guardada."); }
  };
  const setFilter = (type) => { socketRef.current?.emit("cmd_filter", { userId, filterType: type }); setShowFilterMenu(false); };
  const handleVolume = (e) => {
    const vol = e.target.value;
    setStatus(prev => ({ ...prev, volume: vol }));
    socketRef.current?.emit("cmd_volume", { userId, vol });
  };

  const progressPercent = status.song?.durationSec > 0 ? (status.currentMs / (status.song.durationSec * 1000)) * 100 : 0;
  const activeColor = status.color;

  // 👇 ARREGLO DEL PLACEHOLDER GRIS 👇
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
          <div className="w-full max-w-2xl bg-[#1e1f22] rounded-full h-1.5"></div>
        </div>
        <div className="w-1/4 flex justify-end"></div>
      </div>
    );
  }

  // --- MODO PANTALLA COMPLETA (TEATRO) ---
  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-[200] bg-black text-white flex flex-col justify-between overflow-hidden animate-fadeIn">
        {/* Fondo difuminado dinámico */}
        <div className="absolute inset-0 z-0 bg-cover bg-center opacity-30 blur-3xl scale-110" style={{ backgroundImage: `url(${status.song.thumbnail})` }}></div>
        <div className="absolute inset-0 z-0 bg-gradient-to-t from-[#0a0a0c] via-transparent to-black/50"></div>

        {/* Header Pantalla Completa */}
        <div className="z-10 p-8 flex justify-between items-center">
            <div className="flex items-center gap-4">
                <span className="bg-black/40 backdrop-blur-md px-4 py-2 rounded-full text-xs font-bold tracking-widest uppercase flex items-center gap-2 border border-white/10">
                    <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: activeColor }}></div>
                    Live Session
                </span>
            </div>
            <button onClick={() => setIsFullscreen(false)} className="p-3 bg-black/40 hover:bg-white/10 backdrop-blur-md rounded-full transition">
                <ShrinkIcon />
            </button>
        </div>

        {/* Contenido Central: Portada y Letras */}
        <div className="z-10 flex-1 flex flex-col md:flex-row items-center justify-center gap-10 md:gap-24 px-10 h-full">
            <div className="flex flex-col items-center max-w-lg w-full">
                <img src={status.song.thumbnail} className="w-full aspect-square object-cover rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] border border-white/10 mb-8" alt="Cover" />
                <div className="w-full text-center md:text-left flex justify-between items-end gap-4">
                    <div className="min-w-0">
                        <h1 className="text-3xl md:text-5xl font-black tracking-tighter truncate">{status.song.title}</h1>
                        <p className="text-lg md:text-xl font-bold opacity-70 truncate mt-2">{status.song.artist}</p>
                    </div>
                    <button onClick={handleLike} className={`p-3 rounded-full transition transform active:scale-95 ${isLiked ? '' : 'bg-white/5 hover:bg-white/10'}`} style={{ color: isLiked ? activeColor : 'white' }}>
                        <HeartIcon filled={isLiked} />
                    </button>
                </div>
            </div>

            {showLyrics && (
                <div className="w-full max-w-lg h-[60vh] bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 flex flex-col shadow-2xl animate-fadeIn">
                    <div className="flex justify-between items-center border-b border-white/10 pb-4 mb-4">
                        <h3 className="font-black uppercase tracking-widest text-xs opacity-70">Letras</h3>
                        <button onClick={() => setShowLyrics(false)} className="text-xs opacity-50 hover:opacity-100 uppercase font-bold tracking-widest">Cerrar</button>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-4 text-center md:text-left pb-10">
                        {lyrics.loading ? <p className="animate-pulse font-bold opacity-50">Cargando letras...</p> : <pre className="font-sans text-xl md:text-2xl font-bold leading-relaxed opacity-90 whitespace-pre-wrap">{lyrics.text || "No hay letras."}</pre>}
                    </div>
                </div>
            )}
        </div>

        {/* Controles Inferiores Pantalla Completa */}
        <div className="z-10 p-10 flex flex-col gap-6 bg-gradient-to-t from-black to-transparent">
            {/* Barra de progreso */}
            <div className="flex items-center gap-4 max-w-4xl mx-auto w-full">
                <span className="text-xs font-mono opacity-50">{formatTime(status.currentMs)}</span>
                <div onClick={(e) => { const rect = e.currentTarget.getBoundingClientRect(); const p = (e.clientX - rect.left) / rect.width; socketRef.current?.emit("cmd_seek", { userId, targetSec: Math.floor(p * status.song.durationSec) }); }} className="flex-1 bg-white/20 rounded-full h-2 cursor-pointer relative overflow-hidden group">
                    <div className="h-full rounded-full transition-all duration-500 ease-out relative" style={{ width: `${progressPercent}%`, backgroundColor: activeColor }}>
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition shadow-lg"></div>
                    </div>
                </div>
                <span className="text-xs font-mono opacity-50">{formatTime(status.song.durationSec * 1000)}</span>
            </div>

            {/* Botones principales */}
            <div className="flex items-center justify-center gap-8">
                <button onClick={() => setShowLyrics(!showLyrics)} className={`transition p-3 rounded-full ${showLyrics ? 'bg-white/20' : 'opacity-50 hover:opacity-100'}`}><LyricsIcon /></button>
                <button onClick={handlePause} className="w-16 h-16 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition shadow-2xl">
                    {status.isPaused ? <PlayIcon /> : <PauseIcon />}
                </button>
                <button onClick={handleSkip} className="opacity-70 hover:opacity-100 hover:scale-110 transition"><SkipIcon /></button>
            </div>
        </div>
      </div>
    );
  }

  // --- MODO NORMAL (BARRA INFERIOR) ---
  return (
    <>
      {toastMsg && (
        <div className="fixed bottom-[110px] right-6 md:right-10 text-[#0a0a0c] px-4 py-3 rounded-xl shadow-2xl font-bold text-sm z-[100] flex items-center gap-3 transition-all animate-bounce" style={{ backgroundColor: activeColor }}>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
          <span className="truncate max-w-[200px]">{toastMsg}</span>
        </div>
      )}

      {/* COLA DE REPRODUCCIÓN */}
      {showQueue && (
        <div className="fixed right-6 top-6 bottom-[110px] w-[380px] bg-[#111214] border border-[#1e1f22] z-[40] shadow-2xl rounded-2xl p-6 flex flex-col animate-slideInRight">
          <div className="flex justify-between items-center mb-6 border-b border-[#1e1f22] pb-4">
            <h3 className="font-bold uppercase text-xs tracking-widest text-gray-400">Próximos temas</h3>
            <button onClick={() => setShowQueue(false)} className="text-gray-500 hover:text-white text-xl">&times;</button>
          </div>
          <div className="flex flex-col gap-2 overflow-y-auto pr-2 custom-scrollbar">
            {localQueue.length > 0 ? localQueue.map((s, i) => (
              <div key={`${s.videoId}-${i}`} draggable onDragStart={(e)=>handleDragStart(e,i)} onDragOver={(e)=>handleDragOver(e,i)} onDragEnd={handleDragEnd}
                className={`flex items-center gap-4 p-2.5 rounded-xl border transition-all cursor-grab active:cursor-grabbing hover:bg-[#1e1f22] ${draggingIndex === i ? 'opacity-30 scale-95 border-white/20 bg-[#1e1f22]' : 'border-transparent'}`}>
                <span className="text-[10px] font-black opacity-30 w-4 text-center">≡</span>
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

      {/* REPRODUCTOR FLOTANTE INFERIOR */}
      <div className="fixed bottom-0 left-0 w-full bg-[#0a0a0c]/95 backdrop-blur-xl border-t border-[#1e1f22] p-4 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-[60] flex flex-col md:flex-row items-center justify-between px-6 md:px-10 h-[90px]">
        
        {/* INFO CANCIÓN Y WIDGET DE USUARIOS */}
        <div className="flex items-center justify-start w-1/4 gap-4 overflow-hidden">
          <div className="relative group cursor-pointer" onClick={() => setIsFullscreen(true)}>
              <img src={status.song.thumbnail} alt="Cover" className="w-14 h-14 rounded-md shadow-md object-cover group-hover:opacity-50 transition" />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                  <FullscreenIcon />
              </div>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-gray-100 text-sm line-clamp-1 hover:underline cursor-pointer" style={{ textDecorationColor: activeColor }} onClick={() => setIsFullscreen(true)}>
              {status.song.isTrivia ? "Pista Misteriosa" : status.song.title}
            </span>
            <span className="text-gray-500 text-[10px] font-bold uppercase tracking-widest truncate mt-0.5">
              {status.song.isTrivia ? "???" : (status.song.artist || "Desconocido")}
            </span>
          </div>

          {/* WIDGET: Quién escucha */}
          {status.voiceMembers.length > 0 && (
              <div className="hidden lg:flex items-center -space-x-2 ml-4 opacity-70 hover:opacity-100 transition" title={`${status.voiceMembers.length} en el canal`}>
                  {status.voiceMembers.slice(0, 3).map(m => (
                      <img key={m.id} src={m.avatar} className="w-6 h-6 rounded-full border-2 border-[#0a0a0c]" alt={m.name} />
                  ))}
                  {status.voiceMembers.length > 3 && (
                      <div className="w-6 h-6 rounded-full border-2 border-[#0a0a0c] bg-[#1e1f22] flex items-center justify-center text-[8px] font-bold">
                          +{status.voiceMembers.length - 3}
                      </div>
                  )}
              </div>
          )}
        </div>

        {/* CONTROLES CENTRALES */}
        <div className="flex w-2/4 flex-col items-center">
          <div className="hidden md:flex items-center gap-6 mb-1 relative">
            <button onClick={handleLike} className={`transition transform active:scale-95 ${isLiked ? 'scale-110' : 'text-gray-500 hover:text-white'}`} style={{ color: isLiked ? activeColor : '' }} title="Guardar pista">
              <HeartIcon filled={isLiked} />
            </button>
            
            {/* Menú Filtros */}
            <div className="relative">
              <button onClick={() => setShowFilterMenu(!showFilterMenu)} className="text-gray-500 hover:text-white transition transform hover:scale-110" title="Filtros de Audio">
                <FilterIcon />
              </button>
              {showFilterMenu && (
                <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-40 bg-[#18191c] border border-[#2b2d31] rounded-xl shadow-2xl p-2 z-[60] animate-fadeIn">
                  <p className="text-[9px] font-black uppercase text-gray-500 mb-2 px-2 pt-1 text-center border-b border-[#2b2d31] pb-2 tracking-widest">Panel de Filtros</p>
                  <div className="flex flex-col gap-1">
                      <button onClick={()=>setFilter('clear')} className="text-xs font-bold text-gray-300 hover:text-white hover:bg-[#2b2d31] p-2 rounded transition">Apagar Todos</button>
                      <button onClick={()=>setFilter('bass=g=15')} className="text-xs font-bold text-gray-300 hover:text-white hover:bg-[#2b2d31] p-2 rounded transition">Bassboost</button>
                      <button onClick={()=>setFilter('apulsator=hz=0.09')} className="text-xs font-bold text-gray-300 hover:text-white hover:bg-[#2b2d31] p-2 rounded transition">8D Audio</button>
                      <button onClick={()=>setFilter('asetrate=44100*1.25,aresample=44100,atempo=1')} className="text-xs font-bold text-gray-300 hover:text-white hover:bg-[#2b2d31] p-2 rounded transition">Nightcore</button>
                  </div>
                </div>
              )}
            </div>

            <button onClick={handlePause} className="text-white transition transform hover:scale-105 p-1" title={status.isPaused ? "Reanudar" : "Pausar"}>
              {status.isPaused ? <PlayIcon /> : <PauseIcon />}
            </button>
            <button onClick={handleSkip} className="text-gray-500 hover:text-white transition transform hover:scale-110" title="Omitir">
              <SkipIcon />
            </button>

            {/* Menú Playlists */}
            <div className="relative">
              <button onClick={() => setShowPlaylistMenu(!showPlaylistMenu)} className="text-gray-500 hover:text-white transition transform hover:scale-110" title="Añadir a Playlist">
                <MenuIcon />
              </button>
              {showPlaylistMenu && (
                <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-48 bg-[#18191c] border border-[#2b2d31] rounded-xl shadow-2xl p-2 z-[60] animate-fadeIn">
                  <p className="text-[9px] font-black uppercase text-gray-500 mb-2 px-2 pt-1 text-center border-b border-[#2b2d31] pb-2 tracking-widest">Añadir a</p>
                  <div className="max-h-48 overflow-y-auto custom-scrollbar flex flex-col gap-1">
                    {playlists.map(pl => (
                      <button key={pl.id} onClick={() => saveToPlaylist(pl.id)} className="w-full text-left text-[11px] p-2 hover:bg-[#2b2d31] rounded-md transition truncate font-bold text-gray-300">{pl.name}</button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* BARRA DE PROGRESO CAMALEÓN */}
          <div className="w-full max-w-2xl flex items-center gap-3 px-2 mt-1">
            <span className="text-[10px] text-gray-500 font-mono w-10 text-right">{formatTime(status.currentMs)}</span>
            <div onClick={(e) => {
              const bar = e.currentTarget; const rect = bar.getBoundingClientRect();
              const percent = (e.clientX - rect.left) / rect.width;
              socketRef.current?.emit("cmd_seek", { userId, targetSec: Math.floor(percent * status.song.durationSec) });
            }} className="flex-1 bg-[#2b2d31] rounded-full h-1.5 relative overflow-hidden cursor-pointer group">
              <div className="h-full transition-all duration-500 ease-linear rounded-r-full" style={{ width: `${progressPercent}%`, backgroundColor: activeColor }} />
            </div>
            <span className="text-[10px] text-gray-500 font-mono w-10">{formatTime(status.song.durationSec * 1000)}</span>
          </div>
        </div>

        {/* CONTROLES DERECHA */}
        <div className="hidden md:flex w-1/4 justify-end gap-4 items-center">
          {/* Slider Volumen */}
          <div className="flex items-center gap-2 mr-2 w-24 group">
              <svg className="w-4 h-4 text-gray-500 group-hover:text-white transition" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728M11 5L6 9H2v6h4l5 4V5z" /></svg>
              <input type="range" min="0" max="100" value={status.volume} onChange={handleVolume} className="w-full h-1 bg-[#2b2d31] rounded-lg appearance-none cursor-pointer accent-white" />
          </div>

          <button onClick={() => setShowLyrics(!showLyrics)} className={`${showLyrics && !isFullscreen ? 'text-white' : 'text-gray-500'} hover:text-gray-300 transition`} title="Letra">
             <LyricsIcon />
          </button>
          <button onClick={() => setIsFullscreen(true)} className="text-gray-500 hover:text-white transition" title="Pantalla Completa">
             <FullscreenIcon />
          </button>
          <button onClick={() => setShowQueue(!showQueue)} className={`transition-all duration-300 transform ${showQueue ? 'scale-110' : 'text-gray-500 hover:text-white'}`} style={{ color: showQueue || isQueueBouncing ? activeColor : '' }} title="Cola">
             <ListIcon />
          </button>
        </div>
      </div>
    </>
  );
}