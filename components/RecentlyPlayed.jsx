"use client";
import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";

export default function RecentlyPlayed({ history: initialHistory, userId, userName, userAvatar }) {
  const [history, setHistory] = useState(initialHistory || []);
  const [loadingTrackId, setLoadingTrackId] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    const botUrl = process.env.NEXT_PUBLIC_BOT_URL || "http://localhost:3001";
    socketRef.current = io(botUrl, { extraHeaders: { "ngrok-skip-browser-warning": "true" } });

    // 👇 ESCUCHAR NUEVAS CANCIONES EN TIEMPO REAL 👇
    socketRef.current.on('history_updated', (data) => {
      if (data.userId === userId) {
        setHistory(prev => {
          // Evitamos duplicados si el bot mandó el evento dos veces rápido
          const filtered = prev.filter(s => s.videoId !== data.videoId);
          return [data, ...filtered].slice(0, 30); // Guardamos máximo 30
        });
      }
    });

    return () => socketRef.current?.disconnect();
  }, [userId]);

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

  const timeAgo = (dateString) => {
    const seconds = Math.floor((new Date() - new Date(dateString)) / 1000);
    if (seconds < 60) return "hace instantes";
    if (seconds < 3600) return `hace ${Math.floor(seconds / 60)} min`;
    if (seconds < 86400) return `hace ${Math.floor(seconds / 3600)} h`;
    return `hace ${Math.floor(seconds / 86400)} días`;
  };

  return (
    <div className="w-full bg-[#111214] p-8 rounded-3xl border border-[#2b2d31] shadow-lg flex flex-col h-[550px]">
      <div className="flex justify-between items-center mb-6 border-b border-[#2b2d31] pb-4">
          <h3 className="text-2xl font-black text-white tracking-tighter">Historial Reciente</h3>
          <span className="bg-[#5865F2]/10 text-[#5865F2] px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest border border-[#5865F2]/20">
              Tus escuchas
          </span>
      </div>
      
      {history.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 text-center opacity-50">
            <p className="text-gray-400 font-bold mb-2">Aún no has escuchado nada.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2 overflow-y-auto custom-scrollbar pr-2 flex-1">
          {history.map((song, index) => (
            <div key={`${song.videoId}-${index}`} className="group flex items-center justify-between bg-[#1e1f22] p-3 rounded-2xl hover:bg-[#2b2d31] transition border border-transparent hover:border-[#3f4147]">
              <div className="flex items-center gap-4 overflow-hidden">
                <span className="text-gray-600 font-black text-xs w-8 text-center">
                    <svg className="w-4 h-4 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </span>
                <div className="flex flex-col min-w-0">
                  <span className="font-bold text-white text-sm truncate group-hover:text-[#5865F2] transition cursor-default">{song.title}</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-gray-500 text-[10px] font-black uppercase truncate tracking-wider">{song.artist}</span>
                    <span className="text-gray-600 text-[10px]">&bull;</span>
                    <span className="text-gray-600 text-[10px] font-bold">{timeAgo(song.playedAt)}</span>
                  </div>
                </div>
              </div>
              <div>
                <button 
                  disabled={loadingTrackId === song.videoId}
                  onClick={() => handlePlay(song)} 
                  className={`flex items-center justify-center min-w-[100px] px-4 py-2 rounded-xl font-black text-xs uppercase shadow-xl transition ${
                    loadingTrackId === song.videoId 
                      ? 'opacity-100 bg-[#3f4147] text-gray-400 cursor-not-allowed' 
                      : 'opacity-0 group-hover:opacity-100 bg-[#5865F2] text-white hover:scale-105'
                  }`}
                >
                  {loadingTrackId === song.videoId ? (
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  ) : "Reproducir"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}