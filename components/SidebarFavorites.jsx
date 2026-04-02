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
            const exists = prev.find(l => l.videoId === data.videoId);
            if (exists) return prev;
            return [{ videoId: data.videoId, title: data.title, artist: data.artist }, ...prev];
        });
      }
    });

    return () => socketRef.current?.disconnect();
  }, [userId]);

  const handleDelete = async (videoId) => {
    setLikes(prev => prev.filter(l => l.videoId !== videoId));
    try {
      await fetch('/api/likes', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId })
      });
    } catch (e) {
      console.error("Error al borrar:", e);
    }
  };

  const handlePlay = (song) => {
    if (loadingTrackId === song.videoId) return;
    setLoadingTrackId(song.videoId);
    
    socketRef.current?.emit("cmd_play_specific", { 
        userId, 
        video: { videoId: song.videoId, title: song.title, author: song.artist }, 
        userName, 
        userAvatar 
    });

    setTimeout(() => setLoadingTrackId(null), 1500);
  };

  return (
    <div className="px-4 flex flex-col gap-1">
      {/* BOTÓN DESPLEGABLE */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-1 flex justify-between items-center w-full hover:bg-[#1e1f22]/50 rounded-md transition cursor-pointer group"
      >
        <span className="text-[10px] font-black uppercase text-gray-600 group-hover:text-gray-400 tracking-widest transition">
          Tus Favoritos
        </span>
        <div className="flex items-center gap-2">
          <span className="text-gray-500 font-bold text-xs">{likes.length}</span>
          <svg className={`w-3 h-3 text-gray-500 transition-transform ${isOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>
      
      {/* LISTA DE CANCIONES */}
      {isOpen && (
        <div className="max-h-[220px] overflow-y-auto custom-scrollbar flex flex-col gap-1.5 pr-1 mt-1 animate-fadeIn">
          {likes.length === 0 ? (
              <p className="px-4 text-xs text-gray-600 mt-1 italic">No hay favoritos.</p>
          ) : (
              likes.slice(0, 30).map(like => (
                  <div key={like.videoId} 
                       onClick={() => handlePlay(like)}
                       className={`group flex items-center justify-between px-4 py-2 rounded-lg transition-all cursor-pointer ${loadingTrackId === like.videoId ? 'opacity-50' : 'hover:bg-[#1e1f22]/70'}`}
                  >
                      <div className="flex items-center gap-3 min-w-0 flex-1 overflow-hidden">
                          {loadingTrackId === like.videoId ? (
                              <svg className="animate-spin h-3 w-3 text-[#57F287] self-start mt-0.5 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                          ) : (
                              <span className="text-[#57F287]/80 group-hover:text-[#57F287] text-[10px] self-start mt-0.5 flex-shrink-0">♥</span>
                          )}
                          <div className="flex flex-col min-w-0 flex-1 gap-0.5">
                              <span className="font-bold text-gray-300 group-hover:text-white truncate text-xs leading-tight">
                                  {like.title}
                              </span>
                              <span className="text-[9px] text-gray-600 group-hover:text-gray-400 font-bold uppercase truncate leading-tight">
                                  {like.artist}
                              </span>
                          </div>
                      </div>
                      
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDelete(like.videoId); }}
                        className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-500 transition-all flex-shrink-0 px-1"
                        title="Eliminar de favoritos"
                      >
                        ✕
                      </button>
                  </div>
              ))
          )}
        </div>
      )}
    </div>
  );
}