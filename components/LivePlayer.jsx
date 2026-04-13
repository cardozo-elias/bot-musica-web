"use client";
import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import { useSocketStats } from "./SocketContext";
import { useLanguage } from "./LanguageContext";

const formatTime = (ms) => {
  const totalSeconds = Math.floor((ms || 0) / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

const parseLrc = (lrcString) => {
  if (!lrcString) return [];
  const lines = lrcString.split('\n');
  const parsed = [];
  const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/;
  
  lines.forEach(line => {
      const match = timeRegex.exec(line);
      if (match) {
          const minutes = parseInt(match[1]);
          const seconds = parseInt(match[2]);
          const milliseconds = parseInt(match[3]);
          const timeInSeconds = minutes * 60 + seconds + (milliseconds / (match[3].length === 3 ? 1000 : 100));
          const text = line.replace(timeRegex, '').trim();
          if (text) parsed.push({ time: timeInSeconds, text });
      }
  });
  return parsed;
};


const PlayIcon = () => <svg className="w-7 h-7 md:w-8 md:h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>;
const PauseIcon = () => <svg className="w-7 h-7 md:w-8 md:h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>;
const SkipIcon = () => <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z"/></svg>;
const HeartIcon = ({ filled }) => <svg className="w-6 h-6 transition-colors" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={filled ? "0" : "2"} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>;
const ListIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16m-7 6h7" /></svg>;
const MenuIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const FullscreenIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>;
const ShrinkIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 14h4v4m0-4l-5 5m16-5h-4v4m0-4l5 5M4 10h4V6m0 4l-5-5m16 5h-4V6m0 4l5-5" /></svg>;
const FilterIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>;
const LyricsIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
const TrashIcon = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;

export default function LivePlayer({ userId, guildId }) {
  const { setSocketStats } = useSocketStats();
  const { t } = useLanguage();

  const [status, setStatus] = useState({ 
      playing: false, queueList: [], color: '#7e22ce', voiceMembers: [],
      autoplay: false, discovery: false 
  });
  
  const [isLiked, setIsLiked] = useState(false); 
  const [currentVideoId, setCurrentVideoId] = useState(null); 
  const [playlists, setPlaylists] = useState([]);
  
  const [showPlaylistMenu, setShowPlaylistMenu] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showQueue, setShowQueue] = useState(false); 
  const [showLyrics, setShowLyrics] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isIdle, setIsIdle] = useState(false);
  
  const [lyrics, setLyrics] = useState({ title: "", text: "", loading: false });
  const [parsedLyrics, setParsedLyrics] = useState([]);
  const [activeLine, setActiveLine] = useState(-1);
  const [isAutoScroll, setIsAutoScroll] = useState(true);

  const [toastMsg, setToastMsg] = useState(null);
  const [isQueueBouncing, setIsQueueBouncing] = useState(false);
  const [draggingIndex, setDraggingIndex] = useState(null);
  const [localQueue, setLocalQueue] = useState([]);
  
  const isReordering = useRef(false);
  const socketRef = useRef(null);
  const lyricsScrollRef = useRef(null); 
  const lineRefs = useRef([]);
  const idleTimeout = useRef(null);

  useEffect(() => {
    if (!userId) return;
    const botUrl = process.env.NEXT_PUBLIC_BOT_URL || "http://localhost:3001";
    socketRef.current = io(botUrl);

    const interval = setInterval(() => { 
        if (!isReordering.current) socketRef.current?.emit("get_status", { userId, guildId }); 
    }, 1000);
    
    socketRef.current.on("sync_status", (data) => {
      if (isReordering.current) return;
      setSocketStats(data);
      setStatus(prev => ({ ...prev, ...data, color: data.color || '#7e22ce' }));
      
      if (data.playing && data.song) {
        setLocalQueue(data.queueList || []);
        setIsLiked(data.isLiked); 
        setCurrentVideoId(data.song.videoId);
      }
    });

    socketRef.current.on("lyrics_data", (data) => {
      setLyrics({ title: data.title || "", text: data.lyrics || data.error, loading: false });
      setParsedLyrics(data.synced ? parseLrc(data.synced) : []);
    });

    socketRef.current.on("track_added", (title) => { 
        setToastMsg(title); setIsQueueBouncing(true);
        setTimeout(() => setIsQueueBouncing(false), 500); setTimeout(() => setToastMsg(null), 3500); 
    });

    return () => { 
        clearInterval(interval); 
        socketRef.current?.disconnect(); 
    };
  }, [userId, guildId, setSocketStats]);

  useEffect(() => { if (showLyrics && currentVideoId) fetchLyrics(); }, [currentVideoId, showLyrics]);
  useEffect(() => { setIsAutoScroll(true); }, [currentVideoId]);

  useEffect(() => {
    if (parsedLyrics.length > 0 && status.currentMs > 0) {
        const currentSec = (status.currentMs / 1000);
        let newActive = -1;
        for (let i = 0; i < parsedLyrics.length; i++) {
            if (currentSec >= parsedLyrics[i].time) newActive = i;
            else break;
        }
        if (newActive !== activeLine) setActiveLine(newActive);
    }
  }, [status.currentMs, parsedLyrics, activeLine]);

  useEffect(() => {
    if (isAutoScroll && activeLine >= 0 && lineRefs.current[activeLine] && showLyrics) {
        lineRefs.current[activeLine].scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [activeLine, isAutoScroll, showLyrics, isFullscreen]);

  const breakSync = () => { if (isAutoScroll) setIsAutoScroll(false); };

  const handleAction = (cmd, extra = null) => {
    if (!socketRef.current) return;
    socketRef.current.emit(cmd, extra !== null ? { userId, ...extra } : userId);
  };

  useEffect(() => {
    const handleFullscreenChange = () => { 
        const isFull = !!document.fullscreenElement;
        setIsFullscreen(isFull); 
        if (!isFull) setShowLyrics(false);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => setIsFullscreen(true));
    } else {
      if (document.exitFullscreen) document.exitFullscreen().catch(err => console.log(err));
    }
  };

  useEffect(() => {
    if (!isFullscreen) { setIsIdle(false); return; }
    const resetIdle = () => {
        setIsIdle(false);
        if (idleTimeout.current) clearTimeout(idleTimeout.current);
        idleTimeout.current = setTimeout(() => setIsIdle(true), 3000); 
    };
    window.addEventListener("mousemove", resetIdle);
    window.addEventListener("keydown", resetIdle);
    resetIdle(); 
    return () => {
        window.removeEventListener("mousemove", resetIdle);
        window.removeEventListener("keydown", resetIdle);
        if (idleTimeout.current) clearTimeout(idleTimeout.current);
    };
  }, [isFullscreen]);

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
    socketRef.current?.emit("cmd_reorder_queue", { userId, guildId, newQueueIds: localQueue.map(s => s.queueId) });
    setDraggingIndex(null); setTimeout(() => { isReordering.current = false; }, 500);
  };

  const handleRemoveFromQueue = (e, index) => {
    e.stopPropagation();
    const newQueue = localQueue.filter((_, i) => i !== index);
    setLocalQueue(newQueue);
    socketRef.current?.emit("cmd_remove_queue", { userId, guildId, trackIndex: index });
  };

  const handleLike = (e) => { 
      if (e) e.stopPropagation();
      setIsLiked(true); 
      socketRef.current?.emit("cmd_like", userId); 
  };
  
  const handlePause = (e) => {
      if (e) e.stopPropagation();
      setStatus(prev => ({ ...prev, isPaused: !prev.isPaused }));
      socketRef.current?.emit("cmd_pause", userId);
  };
  
  const handleSkip = (e) => {
      if (e) e.stopPropagation();
      setStatus(prev => ({ ...prev, playing: false })); 
      socketRef.current?.emit("cmd_skip", userId);
  };

  const saveToPlaylist = async (playlistId) => {
    const res = await fetch('/api/playlists', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ playlistId, song: status.song }) });
    if (res.ok) { setShowPlaylistMenu(false); alert(t('livePlayer.alerts.saved')); }
  };
  
  const setFilter = (type) => { socketRef.current?.emit("cmd_filter", { userId, filterType: type }); setShowFilterMenu(false); };

  const progressPercent = status.song?.durationSec > 0 ? (status.currentMs / (status.song.durationSec * 1000)) * 100 : 0;
  const activeColor = status.color;
  const isLongTitle = status.song?.title?.length > 20;

  const renderLyricsContent = () => {
    if (lyrics.loading) return <p className="animate-pulse font-bold opacity-50 mt-10 text-center">{t('livePlayer.searching')}</p>;
    
    if (parsedLyrics.length > 0) {
      return (
        <div className="pb-[40vh] pt-[20vh] space-y-4 flex flex-col items-center md:items-start px-4 md:px-8 relative w-full">
            {parsedLyrics.map((line, i) => (
                <p key={i} ref={el => lineRefs.current[i] = el}
                    onClick={() => { 
                        socketRef.current?.emit("cmd_seek", { userId, targetSec: line.time }); 
                        setIsAutoScroll(true); 
                    }}
                    className={`transition-all duration-500 ease-out cursor-pointer w-full text-center md:text-left ${
                        i === activeLine 
                            ? "text-2xl md:text-3xl font-black opacity-100 text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.3)]" 
                            : "text-lg md:text-2xl font-bold opacity-30 hover:opacity-60 text-gray-400"
                    }`}
                >
                    {line.text}
                </p>
            ))}
        </div>
      );
    }

    return (
        <pre className="font-sans text-lg md:text-xl font-semibold leading-relaxed opacity-80 whitespace-pre-wrap text-center md:text-left pt-[10vh] pb-10 px-4 md:px-8">
            {lyrics.text || t('livePlayer.noLyrics')}
        </pre>
    );
  };

  if (!status.playing || !status.song) {
    return (
      <div className="fixed bottom-[65px] md:bottom-0 left-0 w-full glass-panel border-t border-white/5 p-4 z-[60] flex items-center justify-between px-6 md:px-10 h-[60px] md:h-[90px] shadow-2xl">
      </div>
    );
  }

  
  
  
  if (isFullscreen) {
    return (
      <div className={`fixed inset-0 z-[200] bg-black text-white flex flex-col justify-between overflow-hidden animate-fadeIn transition-colors duration-1000 ${isIdle ? 'cursor-none' : ''}`}>
        
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes marquee-ping-pong { 0%, 15% { transform: translateX(0); } 45%, 55% { transform: translateX(calc(-100% + 230px)); } 85%, 100% { transform: translateX(0); } }
          .animate-marquee { display: inline-block; white-space: nowrap; animation: marquee-ping-pong 12s ease-in-out infinite; }
          .scrollbar-hide::-webkit-scrollbar { display: none; }
          .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        `}} />

        <div className="absolute inset-0 z-0 bg-cover bg-center opacity-30 blur-3xl scale-110" style={{ backgroundImage: `url(${status.song.thumbnail})` }}></div>
        <div className="absolute inset-0 z-0 bg-gradient-to-t from-[#0a0a0c] via-transparent to-black/50"></div>

        <div className={`z-10 p-6 md:p-8 flex justify-between items-center transition-opacity duration-700 ease-in-out ${isIdle ? 'opacity-0' : 'opacity-100'}`}>
            <span className="bg-black/40 backdrop-blur-md px-4 py-2 rounded-full text-xs font-bold tracking-widest uppercase flex items-center gap-2 border border-white/10 shadow-lg">
                <div className="w-2 h-2 rounded-full animate-pulse shadow-[0_0_10px_currentColor]" style={{ backgroundColor: activeColor, color: activeColor }}></div>
                {t('livePlayer.liveSession')}
            </span>
            <button onClick={toggleFullscreen} className="p-3 bg-black/40 hover:bg-white/10 backdrop-blur-md rounded-full transition shadow-lg">
                <ShrinkIcon />
            </button>
        </div>

        <div className="z-10 flex-1 flex flex-col md:flex-row items-center justify-center gap-6 md:gap-16 px-6 md:px-10 h-full min-h-0 overflow-hidden">
            <div className={`flex flex-col items-center max-w-lg w-full transition-transform duration-700 ${showLyrics ? 'scale-90 md:-translate-x-4' : 'scale-100'}`}>
                <img src={status.song.thumbnail} className="w-full max-w-[30vh] md:max-w-[40vh] aspect-square object-cover rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] border border-white/10 mb-6" alt="Cover" />
                
                <div className={`w-full text-center md:text-left flex justify-between items-center gap-4 transition-opacity duration-700 ${isIdle ? 'opacity-50' : 'opacity-100'}`}>
                    <div className="min-w-0 py-2">
                        <h1 className="text-2xl md:text-5xl font-black tracking-tighter drop-shadow-xl leading-tight mb-1">{status.song.title}</h1>
                        <p className="text-base md:text-xl font-bold opacity-70 drop-shadow-lg leading-relaxed">{status.song.artist}</p>
                    </div>
                    <button onClick={handleLike} className={`p-4 rounded-full transition transform active:scale-95 shadow-xl shrink-0 ${isLiked ? 'bg-white text-black' : 'bg-white/5 text-white hover:bg-white/10'}`} style={{ color: isLiked ? activeColor : '' }}>
                        <HeartIcon filled={isLiked} />
                    </button>
                </div>
            </div>

            {showLyrics && (
                <div className="w-full max-w-3xl h-[45vh] md:h-[60vh] bg-transparent flex flex-col animate-fadeIn overflow-hidden relative">
                    {!isAutoScroll && parsedLyrics.length > 0 && (
                        <div className={`absolute bottom-6 right-4 md:right-10 z-50 animate-fadeIn transition-opacity duration-500 ${isIdle ? 'opacity-0' : 'opacity-100'}`}>
                            <button onClick={() => setIsAutoScroll(true)} className="bg-black/80 backdrop-blur-md text-white px-4 py-2 rounded-full text-xs font-bold border border-white/20 shadow-2xl hover:scale-105 transition hover:bg-white/10">
                                {t('livePlayer.sync')}
                            </button>
                        </div>
                    )}
                    <div ref={lyricsScrollRef} onWheel={breakSync} onTouchStart={breakSync} onMouseDown={breakSync}
                      className={`flex-1 overflow-y-auto ${isIdle && isFullscreen ? 'scrollbar-hide' : 'custom-scrollbar'}`}
                      style={{ WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)', maskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)' }}
                    >
                        {renderLyricsContent()}
                    </div>
                </div>
            )}
        </div>

        <div className={`z-10 p-6 md:p-10 flex flex-col gap-4 md:gap-6 bg-gradient-to-t from-black to-transparent transition-opacity duration-700 ease-in-out ${isIdle ? 'opacity-0' : 'opacity-100'}`}>
            <div className="flex items-center gap-4 max-w-4xl mx-auto w-full">
                <span className="text-[10px] md:text-xs font-mono opacity-50">{formatTime(status.currentMs)}</span>
                <div onClick={(e) => { const rect = e.currentTarget.getBoundingClientRect(); const p = (e.clientX - rect.left) / rect.width; socketRef.current?.emit("cmd_seek", { userId, targetSec: Math.floor(p * status.song.durationSec) }); }} className="flex-1 bg-white/20 rounded-full h-1.5 md:h-2 cursor-pointer relative overflow-hidden group">
                    <div className="h-full rounded-full transition-all duration-500 ease-out relative" style={{ width: `${progressPercent}%`, backgroundColor: activeColor }}>
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition shadow-lg"></div>
                    </div>
                </div>
                <span className="text-[10px] md:text-xs font-mono opacity-50">{formatTime(status.song.durationSec * 1000)}</span>
            </div>

            <div className="flex items-center justify-center gap-8 md:gap-10">
                <button onClick={() => setShowLyrics(!showLyrics)} className={`transition p-2 md:p-3 rounded-full ${showLyrics ? 'bg-white/20 text-white' : 'opacity-50 hover:opacity-100'}`}><LyricsIcon /></button>
                <button onClick={handlePause} className="w-14 h-14 md:w-20 md:h-20 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition shadow-[0_0_30px_rgba(255,255,255,0.3)]">
                    {status.isPaused ? <PlayIcon /> : <PauseIcon />}
                </button>
                <button onClick={handleSkip} className="opacity-70 hover:opacity-100 hover:scale-110 transition scale-110 md:scale-125"><SkipIcon /></button>
            </div>
        </div>
      </div>
    );
  }

  
  
  
  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
          @keyframes marquee-ping-pong { 
              0%, 15% { transform: translateX(0); } 
              45%, 55% { transform: translateX(calc(-100% + 230px)); } 
              85%, 100% { transform: translateX(0); } 
          } 
          .animate-marquee { display: inline-block; white-space: nowrap; animation: marquee-ping-pong 12s ease-in-out infinite; }
          .scrollbar-hide::-webkit-scrollbar { display: none; }
          .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />

      {toastMsg && (
        <div className="fixed bottom-[130px] md:bottom-[110px] right-4 md:right-10 text-[#0a0a0c] px-4 py-3 rounded-xl shadow-2xl font-bold text-sm z-[100] flex items-center gap-3 transition-all animate-bounce" style={{ backgroundColor: activeColor }}>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
          <span className="truncate max-w-[200px]">{toastMsg}</span>
        </div>
      )}

      {showLyrics && (
        <div className="fixed inset-0 bg-[#0a0a0c]/80 z-[100] p-4 flex items-center justify-center animate-fadeIn backdrop-blur-md">
          <div className="glass-panel rounded-3xl shadow-2xl w-full max-w-2xl h-[80vh] flex flex-col overflow-hidden relative border border-white/10">
            <div className="p-6 border-b border-white/5 flex justify-between items-center shrink-0 z-10 bg-black/40">
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-white truncate">{status.song.title}</h2>
                <p className="text-xs font-bold uppercase tracking-widest" style={{color: activeColor}}>{String(status.song.artist)}</p>
              </div>
              <button onClick={() => setShowLyrics(false)} className="text-gray-500 hover:text-white transition text-sm font-bold uppercase tracking-widest">{t('livePlayer.close')}</button>
            </div>
            
            <div className="flex-1 relative bg-black/20">
                {!isAutoScroll && parsedLyrics.length > 0 && (
                    <div className="absolute bottom-6 right-6 z-50 animate-fadeIn">
                        <button onClick={() => setIsAutoScroll(true)} className="bg-black/80 backdrop-blur-md text-white px-4 py-2 rounded-full text-xs font-bold border border-white/20 shadow-2xl hover:scale-105 transition hover:bg-white/10">
                            {t('livePlayer.sync')}
                        </button>
                    </div>
                )}
                <div 
                  ref={lyricsScrollRef} 
                  onWheel={breakSync} onTouchStart={breakSync} onMouseDown={breakSync}
                  className="absolute inset-0 overflow-y-auto custom-scrollbar"
                  style={{ WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)', maskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)' }}
                >
                    {renderLyricsContent()}
                </div>
            </div>
          </div>
        </div>
      )}

      {showQueue && (
        <div className="fixed right-4 md:right-6 top-6 bottom-[130px] md:bottom-[110px] w-auto max-w-[380px] bg-[#0a0a0c]/90 backdrop-blur-xl border border-white/10 z-[40] shadow-2xl rounded-2xl p-4 md:p-6 flex flex-col animate-slideInRight">
          <div className="flex justify-between items-center mb-4 md:mb-6 border-b border-white/10 pb-4">
            <h3 className="font-bold uppercase text-xs tracking-widest" style={{ color: activeColor }}>{t('livePlayer.queue.title')}</h3>
            <button onClick={() => setShowQueue(false)} className="text-gray-500 hover:text-white text-xl">&times;</button>
          </div>
          <div className="flex flex-col gap-2 overflow-y-auto pr-2 custom-scrollbar">
            {localQueue.length > 0 ? localQueue.map((s, i) => (
              <div key={`queue-${s.queueId || i}`} draggable onDragStart={(e)=>handleDragStart(e,i)} onDragOver={(e)=>handleDragOver(e,i)} onDragEnd={handleDragEnd}
                className={`group relative overflow-hidden flex items-center gap-3 md:gap-4 p-2 md:p-2.5 rounded-xl border transition-all cursor-grab active:cursor-grabbing hover:bg-white/5 shrink-0 ${draggingIndex === i ? 'opacity-30 scale-95 border-white/20 bg-white/5' : 'border-transparent'}`}
              >
                <span className="text-[10px] font-black opacity-30 w-3 text-center hidden md:block">≡</span>
                <img src={s.thumbnail} className="w-8 h-8 md:w-10 md:h-10 rounded object-cover flex-shrink-0 border border-white/5" alt="" />
                
                <div className="flex flex-col min-w-0 flex-1 pr-6">
                  <span className="text-xs md:text-sm font-bold text-gray-200 truncate">{s.title}</span>
                  <span className="text-[9px] md:text-[10px] text-gray-500 font-bold uppercase truncate">{String(s.artist)}</span>
                </div>

                <div className="absolute right-0 top-0 bottom-0 flex items-center px-2 bg-gradient-to-l from-[#0a0a0c] to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-20">
                    <button 
                      onClick={(e) => handleRemoveFromQueue(e, i)} 
                      className="p-1 md:p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/20 rounded-lg transition-colors cursor-pointer" 
                      title={t('livePlayer.queue.remove')}
                    >
                        <TrashIcon />
                    </button>
                </div>
              </div>
            )) : <p className="text-gray-500 text-xs italic text-center py-4">{t('livePlayer.queue.empty')}</p>}
          </div>
        </div>
      )}

      
      <div 
        className="fixed bottom-[65px] md:bottom-0 left-0 w-full border-t border-white/5 shadow-[0_-10px_40px_rgba(0,0,0,0.8)] z-[60] flex items-center justify-between px-4 md:px-10 h-[60px] md:h-[90px] transition-colors duration-1000 cursor-pointer md:cursor-auto" 
        style={{ background: `linear-gradient(90deg, ${activeColor}20 0%, rgba(10,10,12,0.95) 30%, rgba(10,10,12,0.95) 100%)`, backdropFilter: 'blur(20px)' }}
        onClick={() => { if (window.innerWidth < 768) toggleFullscreen(); }}
      >
        <div className="absolute bottom-0 left-0 w-full h-[2px] bg-white/5 md:hidden">
            <div className="h-full transition-all duration-500 ease-linear" style={{ width: `${progressPercent}%`, backgroundColor: activeColor }} />
        </div>

        <div className="flex items-center justify-start w-[70%] md:w-1/4 gap-3 md:gap-4 overflow-hidden">
          <div className="relative shrink-0 hidden md:block" onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }}>
              <img src={status.song.thumbnail} alt="Cover" className="w-14 h-14 rounded-md shadow-md object-cover hover:opacity-50 transition border border-white/10" />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition"><FullscreenIcon /></div>
          </div>
          
          <img src={status.song.thumbnail} alt="Cover" className="w-10 h-10 rounded shadow-md object-cover md:hidden shrink-0 border border-white/10" />
          
          <div className="flex flex-col min-w-0 w-full relative overflow-hidden">
            <span className={`font-bold text-gray-100 text-xs md:text-sm md:hover:underline ${isLongTitle ? 'animate-marquee' : 'truncate'}`} style={{ textDecorationColor: activeColor }}>
              {status.song.isTrivia ? t('livePlayer.mysterious') : status.song.title}
            </span>
            <span className="text-gray-500 text-[9px] md:text-[10px] font-bold uppercase tracking-widest truncate mt-0.5">{status.song.isTrivia ? "???" : (status.song.artist || t('livePlayer.unknown'))}</span>
          </div>
        </div>

        <div className="flex w-[30%] md:w-2/4 justify-end md:justify-center items-center gap-4 md:gap-0">
          <div className="hidden md:flex flex-col items-center w-full">
            <div className="flex items-center gap-6 mb-1 relative">
              <button onClick={handleLike} className={`transition transform active:scale-95 ${isLiked ? 'scale-110' : 'text-gray-400 hover:text-white'}`} style={{ color: isLiked ? activeColor : '' }} title={t('livePlayer.tooltips.save')}><HeartIcon filled={isLiked} /></button>
              <div className="relative">
                <button onClick={(e) => { e.stopPropagation(); setShowFilterMenu(!showFilterMenu); }} className="text-gray-400 hover:text-[#7e22ce] transition transform hover:scale-110" title={t('livePlayer.tooltips.filters')}><FilterIcon /></button>
                {showFilterMenu && (
                  <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-40 bg-[#0a0a0c]/90 backdrop-blur-xl border border-[#7e22ce]/30 rounded-xl shadow-2xl p-2 z-[60] animate-fadeIn">
                    <p className="text-[9px] font-black uppercase text-[#7e22ce] mb-2 px-2 pt-1 text-center border-b border-white/10 pb-2 tracking-widest">{t('livePlayer.filters.title')}</p>
                    <div className="flex flex-col gap-1">
                        <button onClick={(e)=>{ e.stopPropagation(); setFilter('clear'); }} className="text-xs font-bold text-gray-300 hover:text-white hover:bg-white/10 p-2 rounded transition">{t('livePlayer.filters.clear')}</button>
                        <button onClick={(e)=>{ e.stopPropagation(); setFilter('bass=g=15'); }} className="text-xs font-bold text-gray-300 hover:text-white hover:bg-white/10 p-2 rounded transition">Bassboost</button>
                        <button onClick={(e)=>{ e.stopPropagation(); setFilter('apulsator=hz=0.09'); }} className="text-xs font-bold text-gray-300 hover:text-white hover:bg-white/10 p-2 rounded transition">8D Audio</button>
                        <button onClick={(e)=>{ e.stopPropagation(); setFilter('asetrate=44100*1.25,aresample=44100,atempo=1'); }} className="text-xs font-bold text-gray-300 hover:text-white hover:bg-white/10 p-2 rounded transition">Nightcore</button>
                    </div>
                  </div>
                )}
              </div>
              <button onClick={handlePause} className="text-white transition transform hover:scale-105 p-1 drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]" title={status.isPaused ? t('livePlayer.tooltips.resume') : t('livePlayer.tooltips.pause')}>{status.isPaused ? <PlayIcon /> : <PauseIcon />}</button>
              <button onClick={handleSkip} className="text-gray-400 hover:text-[#7e22ce] transition transform hover:scale-110" title={t('livePlayer.tooltips.skip')}><SkipIcon /></button>
              <div className="relative">
                <button onClick={(e) => { e.stopPropagation(); setShowPlaylistMenu(!showPlaylistMenu); }} className="text-gray-400 hover:text-[#7e22ce] transition transform hover:scale-110" title={t('livePlayer.tooltips.addTo')}><MenuIcon /></button>
                {showPlaylistMenu && (
                  <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-48 bg-[#0a0a0c]/90 backdrop-blur-xl border border-[#7e22ce]/30 rounded-xl shadow-2xl p-2 z-[60] animate-fadeIn">
                    <p className="text-[9px] font-black uppercase text-[#7e22ce] mb-2 px-2 pt-1 text-center border-b border-white/10 pb-2 tracking-widest">{t('livePlayer.menu.title')}</p>
                    <div className="max-h-48 overflow-y-auto custom-scrollbar flex flex-col gap-1">
                      {playlists.map(pl => <button key={pl.id} onClick={(e) => { e.stopPropagation(); saveToPlaylist(pl.id); }} className="w-full text-left text-[11px] p-2 hover:bg-white/10 rounded-md transition truncate font-bold text-gray-300">{pl.name}</button>)}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="w-full max-w-2xl flex items-center gap-3 px-2 mt-1">
              <span className="text-[10px] text-gray-400 font-mono w-10 text-right">{formatTime(status.currentMs)}</span>
              <div onClick={(e) => { e.stopPropagation(); const rect = e.currentTarget.getBoundingClientRect(); const percent = (e.clientX - rect.left) / rect.width; socketRef.current?.emit("cmd_seek", { userId, targetSec: Math.floor(percent * status.song.durationSec) }); }} className="flex-1 bg-white/10 rounded-full h-1.5 relative overflow-hidden cursor-pointer group">
                <div className="h-full transition-all duration-500 ease-linear rounded-r-full" style={{ width: `${progressPercent}%`, backgroundColor: activeColor }} />
              </div>
              <span className="text-[10px] text-gray-400 font-mono w-10">{formatTime(status.song.durationSec * 1000)}</span>
            </div>
          </div>

          <div className="flex md:hidden items-center gap-3">
              <button onClick={handleLike} className={`transition transform active:scale-95 ${isLiked ? 'scale-110' : 'text-gray-400'}`} style={{ color: isLiked ? activeColor : '' }}><HeartIcon filled={isLiked} /></button>
              <button onClick={handlePause} className="text-white transition transform active:scale-90">{status.isPaused ? <PlayIcon /> : <PauseIcon />}</button>
          </div>
        </div>

        
        <div className="hidden md:flex w-1/4 justify-end gap-5 items-center">
          
          <div className="flex items-center gap-1.5 mr-2">
            <button 
                onClick={(e) => { e.stopPropagation(); handleAction("cmd_toggle_autoplay"); }} 
                className={`text-[9px] font-bold px-2 py-1 rounded transition-all border ${status.autoplay ? 'text-white border-transparent shadow-[0_0_10px_rgba(255,255,255,0.1)]' : 'text-gray-500 border-white/10 hover:text-white'}`}
                style={{ backgroundColor: status.autoplay ? activeColor : 'transparent' }}
                title="Modo Estricto (Likes)"
            >
                AUTO
            </button>
            <button 
                onClick={(e) => { e.stopPropagation(); handleAction("cmd_toggle_discovery"); }} 
                className={`text-[9px] font-bold px-2 py-1 rounded transition-all border ${status.discovery ? 'text-white border-transparent shadow-[0_0_10px_rgba(255,255,255,0.1)]' : 'text-gray-500 border-white/10 hover:text-white'}`}
                style={{ backgroundColor: status.discovery ? activeColor : 'transparent' }}
                title="Modo Descubrimiento (Géneros)"
            >
                MIX
            </button>
          </div>

          <button onClick={() => setShowLyrics(!showLyrics)} className={`${showLyrics && !isFullscreen ? 'text-[#7e22ce]' : 'text-gray-400'} hover:text-white transition`} title={t('livePlayer.tooltips.lyrics')}><LyricsIcon /></button>
          <button onClick={toggleFullscreen} className="text-gray-400 hover:text-white transition" title={t('livePlayer.tooltips.fullscreen')}><FullscreenIcon /></button>
          <button onClick={() => setShowQueue(!showQueue)} className={`transition-all duration-300 transform ${showQueue ? 'scale-110' : 'text-gray-400 hover:text-white'}`} style={{ color: showQueue || isQueueBouncing ? activeColor : '' }} title={t('livePlayer.queue.title')}><ListIcon /></button>
        </div>
      </div>
    </>
  );
}