"use client";
import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";

export default function SidebarFavorites({ initialLikes, userId, userName, userAvatar }) {
  const [likes, setLikes] = useState(initialLikes || []);
  const [isOpen, setIsOpen] = useState(true);
  const [loadingTrackId, setLoadingTrackId] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    const botUrl = process.env.NEXT_PUBLIC_BOT_URL || "http://localhost:3001";
    socketRef.current = io(botUrl, { extraHeaders: { "ngrok-skip-browser-warning": "true" } });

    socketRef.current.on('like_added', (data) => {
      if (data.userId === userId) {
        setLikes(prev => {
            if (prev.some(l => l.videoId === data.videoId)) return prev;
            return [{ videoId: data.videoId, title: data.title, artist: data.artist }, ...prev];
        });
      }
    });

    return () => socketRef.current?.disconnect();
  }, [userId]);

  const handleAddToQueue = (e, song) => {
    e.stopPropagation();
    socketRef.current?.emit("cmd_add_queue", { 
        userId, video: { videoId: song.videoId, title: song.title, author: song.artist }, userName, userAvatar 
    });
  };

  const handleDelete = async (e, videoId) => {
    e.stopPropagation();
    setLikes(prev => prev.filter(l => l.videoId !== videoId));
    try {
      await fetch('/api/likes', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId })
      });
    } catch (e) { console.error("Error:", e); }
  };

  const handlePlay = (song) => {
    if (loadingTrackId === song.videoId) return;
    setLoadingTrackId(song.videoId);
    socketRef.current?.emit("cmd_play_specific", { 
        userId, video: { videoId: song.videoId, title: song.title, author: song.artist }, userName, userAvatar 
    });
    setTimeout(() => setLoadingTrackId(null), 1500);
  };

  return (
    <div className="px-4 flex flex-col gap-1">
      
      {/* 👇 ANIMACIÓN OPTIMIZADA: Comienza rápido y hace ping-pong 👇 */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes marquee-favorites { 
          0%, 5% { transform: translateX(0); } 
          95%, 100% { transform: translateX(calc(-100% + 150px)); } 
        }
        .group:hover .animate-marquee-fav {
          display: inline-block;
          white-space: nowrap;
          width: auto;
          min-width: 100%;
          animation: marquee-favorites 6s linear infinite alternate;
        }
      `}} />

      <button onClick={() => setIsOpen(!isOpen)} className="px-4 py-2 flex justify-between items-center w-full hover:bg-[#1e1f22]/50 rounded-md transition group">
        <span className="text-[10px] font-black uppercase text-gray-500 group-hover:text-gray-400 tracking-widest transition">
          Tus Favoritos
        </span>
        <div className="flex items-center gap-2">
          <span className="text-gray-500 font-bold text-xs">{likes.length}</span>
          <svg className={`w-3 h-3 text-gray-500 transition-transform ${isOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>
      
      {isOpen && (
        <div className="max-h-[380px] overflow-y-auto custom-scrollbar flex flex-col gap-1 pr-1 mt-1">
          {likes.length === 0 ? (
              <p className="px-4 text-xs text-gray-600 mt-1 italic">No hay favoritos.</p>
          ) : (
              likes.map(like => (
                  <div key={like.videoId} onClick={() => handlePlay(like)} 
                       className="group flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer hover:bg-[#1e1f22] shrink-0 min-h-[64px] relative overflow-hidden"
                  >
                      {/* Icono de Estado (Z-Index alto para estar siempre arriba) */}
                      <div className="w-4 h-4 flex items-center justify-center flex-shrink-0 z-20 bg-inherit">
                        {loadingTrackId === like.videoId ? (
                            <svg className="animate-spin h-3.5 w-3.5 text-[#57F287]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        ) : (
                            <span className="text-[#57F287]/80 group-hover:text-[#57F287] text-[10px]">♥</span>
                        )}
                      </div>

                      {/* Info de la canción */}
                      <div className="flex-1 flex flex-col min-w-0 pr-12 overflow-hidden relative">
                          <div className="w-full overflow-hidden">
                              <p className="font-bold text-gray-200 text-xs truncate animate-marquee-fav">
                                  {like.title}
                              </p>
                          </div>
                          <div className="w-full overflow-hidden mt-0.5">
                              <p className="text-[10px] text-gray-600 font-bold uppercase truncate animate-marquee-fav">
                                  {like.artist}
                              </p>
                          </div>
                      </div>

                      {/* 👇 ESCUDO PROTECTOR: Botones con fondo sólido para tapar el texto al deslizar 👇 */}
                      <div className="absolute right-0 top-0 bottom-0 flex items-center gap-1 px-3 bg-[#1e1f22] opacity-0 group-hover:opacity-100 transition-opacity z-20 shadow-[-10px_0_15px_#1e1f22]">
                          <button 
                            onClick={(e) => handleAddToQueue(e, like)}
                            className="p-1.5 text-gray-400 hover:text-[#57F287] transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                          </button>
                          <button 
                            onClick={(e) => handleDelete(e, like.videoId)}
                            className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                      </div>

                  </div>
              ))
          )}
        </div>
      )}
    </div>
  );
}