"use client";
import { useState, useEffect } from "react";
import { io } from "socket.io-client";

export default function SidebarFavorites({ initialLikes, userId, userName, userAvatar }) {
  const [likes, setLikes] = useState(initialLikes || []);
  const [isOpen, setIsOpen] = useState(true);
  const [loadingTrackId, setLoadingTrackId] = useState(null);

  useEffect(() => {
    const botUrl = process.env.NEXT_PUBLIC_BOT_URL || "http://localhost:3001";
    const socket = io(botUrl, { extraHeaders: { "ngrok-skip-browser-warning": "true" } });

    socket.on('like_added', (data) => {
      if (data.userId === userId) {
        setLikes(prev => {
            // Evitar duplicados en el estado de React por si acaso
            if (prev.some(l => l.videoId === data.videoId)) return prev;
            return [{ videoId: data.videoId, title: data.title, artist: data.artist }, ...prev];
        });
      }
    });

    return () => socket.disconnect();
  }, [userId]);

  const handleAddToQueue = (e, song) => {
    e.stopPropagation();
    const socket = io(process.env.NEXT_PUBLIC_BOT_URL || "http://localhost:3001");
    socket.emit("cmd_add_queue", { 
        userId, 
        video: { videoId: song.videoId, title: song.title, author: song.artist }, 
        userName, 
        userAvatar 
    });
  };

  const handleDelete = async (e, videoId) => {
    e.stopPropagation();
    setLikes(prev => prev.filter(l => l.videoId !== videoId));
    await fetch('/api/likes', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videoId })
    });
  };

  const handlePlay = (song) => {
    if (loadingTrackId === song.videoId) return;
    setLoadingTrackId(song.videoId);
    const socket = io(process.env.NEXT_PUBLIC_BOT_URL || "http://localhost:3001");
    socket.emit("cmd_play_specific", { 
        userId, 
        video: { videoId: song.videoId, title: song.title, author: song.artist }, 
        userName, 
        userAvatar 
    });
    setTimeout(() => setLoadingTrackId(null), 1500);
  };

  return (
    <div className="px-4 flex flex-col gap-1">
      <button onClick={() => setIsOpen(!isOpen)} className="px-4 py-2 flex justify-between items-center w-full hover:bg-[#1e1f22]/50 rounded-md transition group">
        <span className="text-[10px] font-black uppercase text-gray-500 group-hover:text-gray-300 tracking-widest transition">Tus Favoritos</span>
        <div className="flex items-center gap-2">
          <span className="text-gray-500 font-bold text-[10px]">{likes.length}</span>
          <svg className={`w-3 h-3 text-gray-600 transition-transform ${isOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
        </div>
      </button>
      
      {isOpen && (
        <div className="max-h-[380px] overflow-y-auto custom-scrollbar flex flex-col gap-1 pr-1 mt-1">
          {likes.length === 0 ? (
              <p className="px-4 text-[11px] text-gray-600 italic">No hay favoritos guardados.</p>
          ) : (
              likes.map(like => (
                  <div key={like.videoId} onClick={() => handlePlay(like)} className="group flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-[#1e1f22] transition-all cursor-pointer border border-transparent hover:border-white/5 relative overflow-hidden">
                      
                      {/* Información de la canción (con scroll o 2 líneas) */}
                      <div className="flex flex-col min-w-0 flex-1 pr-2">
                          <span className="font-bold text-gray-200 text-[12px] leading-[1.2] line-clamp-2 group-hover:text-white transition-colors">
                              {like.title}
                          </span>
                          <span className="text-[9px] text-gray-500 font-black uppercase tracking-wider mt-1 truncate">
                              {like.artist}
                          </span>
                      </div>

                      {/* Botones de acción: Ocultos por defecto, aparecen en hover */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-2 group-hover:translate-x-0">
                          <button 
                            onClick={(e) => handleAddToQueue(e, like)}
                            className="p-1.5 text-gray-400 hover:text-[#57F287] hover:bg-[#57F287]/10 rounded-lg transition-colors"
                            title="A la cola"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                          </button>

                          <button 
                            onClick={(e) => handleDelete(e, like.videoId)}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Eliminar"
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