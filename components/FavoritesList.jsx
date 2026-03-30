"use client";
import { useEffect, useState } from "react";
import { io } from "socket.io-client";

export default function FavoritesList({ likes, userId, userName, userAvatar }) {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // CORRECCIÓN: Usamos botUrl aquí
    const botUrl = process.env.NEXT_PUBLIC_BOT_URL || "http://localhost:3001";
    const s = io(botUrl);
    setSocket(s);
    return () => s.disconnect();
  }, []);

  const handlePlay = (song) => {
    socket?.emit("cmd_play_specific", { 
        userId, 
        video: { videoId: song.videoId, title: song.title, author: song.artist }, 
        userName, 
        userAvatar 
    });
  };

  return (
    <div className="w-full bg-[#111214] p-8 rounded-3xl border border-[#2b2d31] shadow-lg flex flex-col h-[500px]">
      <div className="flex justify-between items-center mb-6 border-b border-[#2b2d31] pb-4">
          <h3 className="text-2xl font-black text-white tracking-tighter">Toda tu Colección</h3>
          <span className="bg-[#57F287]/10 text-[#57F287] px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest border border-[#57F287]/20">
              {likes.length} Pistas
          </span>
      </div>
      
      {likes.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 text-center opacity-50">
            <p className="text-gray-400 font-bold mb-2">No hay favoritos aún.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2 overflow-y-auto custom-scrollbar pr-2 flex-1">
          {likes.map((song, index) => (
            <div key={index} className="group flex items-center justify-between bg-[#1e1f22] p-3 rounded-2xl hover:bg-[#2b2d31] transition border border-transparent hover:border-[#3f4147]">
              <div className="flex items-center gap-4 overflow-hidden">
                <span className="text-gray-600 font-black text-xs w-6 text-center">{index + 1}</span>
                <div className="flex flex-col min-w-0">
                  <span className="font-bold text-white text-sm truncate group-hover:text-[#57F287] transition cursor-default">{song.title}</span>
                  <span className="text-gray-500 text-[10px] font-black uppercase truncate tracking-wider mt-0.5">{song.artist}</span>
                </div>
              </div>
              <div>
                <button 
                  onClick={() => handlePlay(song)} 
                  className="opacity-0 group-hover:opacity-100 bg-[#57F287] text-black px-4 py-2 rounded-xl font-black text-xs uppercase shadow-xl hover:scale-105 transition"
                >
                  Reproducir
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}