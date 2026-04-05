"use client";
import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";

export default function SidebarFavorites({ initialLikes, userId, userName, userAvatar }) {
  const [likes, setLikes] = useState(initialLikes || []);
  const [isOpen, setIsOpen] = useState(true);
  const [loadingTrackId, setLoadingTrackId] = useState(null);
  const socketRef = useRef(null);

  // LOG PARA CONFIRMAR CARGA (Míralo en F12)
  useEffect(() => {
    console.log("⭐ SidebarFavorites v2.0 Cargado (Con + y X)");
  }, []);

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

  const handleAddToQueue = (e, song) => {
    e.stopPropagation();
    console.log("Añadiendo a cola:", song.title);
    socketRef.current?.emit("cmd_add_queue", { 
        userId, 
        video: { videoId: song.videoId, title: song.title, author: song.artist }, 
        userName, 
        userAvatar 
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
    } catch (e) { console.error("Error al borrar:", e); }
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
      <button onClick={() => setIsOpen(!isOpen)} className="px-4 py-2 flex justify-between items-center w-full hover:bg-[#1e1f22]/50 rounded-md transition cursor-pointer group">
        <span className="text-[10px] font-black uppercase text-gray-600 group-hover:text-gray-400 tracking-widest transition">Mis favoritos</span>
        <div className="flex items-center gap-2">
          <span className="text-gray-500 font-bold text-xs">{likes.length}</span>
          <svg className={`w-3 h-3 text-gray-500 transition-transform ${isOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
        </div>
      </button>
      
      {isOpen && (
        <div className="max-h-[350px] overflow-y-auto custom-scrollbar flex flex-col gap-1 pr-1 mt-1 animate-fadeIn">
          {likes.length === 0 ? (
              <p className="px-4 text-xs text-gray-600 mt-1 italic">No hay favoritos.</p>
          ) : (
              likes.map(like => (
                  <div key={like.videoId} onClick={() => handlePlay(like)} className="group flex items-center justify-between px-4 py-2.5 rounded-xl transition-all cursor-pointer shrink-0 hover:bg-[#1e1f22]">
                      <div className="flex items-start gap-3 min-w-0 flex-1 overflow-hidden">
                          {loadingTrackId === like.videoId ? (
                              <svg className="animate-spin h-3 w-3 text-[#57F287] mt-0.5 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                          ) : (
                              <span className="text-[#57F287]/80 group-hover:text-[#57F287] text-[10px] mt-0.5 flex-shrink-0">♥</span>
                          )}
                          <div className="flex flex-col min-w-0 flex-1">
                              <span className="font-bold text-gray-300 group-hover:text-white truncate text-xs">{like.title}</span>
                              <span className="text-[10px] text-gray-600 group-hover:text-gray-400 font-bold uppercase truncate mt-0.5">{like.artist}</span>
                          </div>
                      </div>

                      {/* CONTENEDOR DE ICONOS (ml-2 asegura separación) */}
                      <div className="flex items-center gap-1 ml-2 shrink-0">
                          {/* BOTÓN + (Añadir a cola) */}
                          <button 
                            onClick={(e) => handleAddToQueue(e, like)}
                            className="p-1.5 text-gray-600 hover:text-[#57F287] hover:bg-[#57F287]/10 rounded-lg transition-all opacity-40 group-hover:opacity-100"
                            title="Añadir a la cola"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                            </svg>
                          </button>

                          {/* BOTÓN X (Eliminar) */}
                          <button 
                            onClick={(e) => handleDelete(e, like.videoId)}
                            className="p-1.5 text-gray-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all opacity-40 group-hover:opacity-100"
                            title="Quitar de favoritos"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
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