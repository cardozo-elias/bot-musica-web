"use client";
import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useRouter } from "next/navigation";

export default function FavoritesList({ likes, userId, userName, userAvatar }) {
  const [socket, setSocket] = useState(null);
  const [loadingTrackId, setLoadingTrackId] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const botUrl = process.env.NEXT_PUBLIC_BOT_URL || "http://localhost:3001";
    const s = io(botUrl, {
      extraHeaders: { "ngrok-skip-browser-warning": "true" },
    });
    setSocket(s);
    return () => s.disconnect();
  }, []);

  const handlePlay = (song) => {
    if (loadingTrackId === song.videoId) return;

    setLoadingTrackId(song.videoId);

    socket?.emit("cmd_play_specific", {
      userId,
      video: { videoId: song.videoId, title: song.title, author: song.artist },
      userName,
      userAvatar,
    });

    setTimeout(() => setLoadingTrackId(null), 1500);
  };

  const handleDelete = async (videoId) => {
    if (!confirm("¿Eliminar pista de tus favoritos?")) return;

    try {
      const res = await fetch("/api/likes", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId }),
      });

      if (res.ok) {
        router.refresh();
      }
    } catch (e) {
      console.error("Error al borrar:", e);
    }
  };

  return (
    <div className="w-full bg-[#111214] p-8 rounded-3xl border border-[#2b2d31] shadow-lg flex flex-col h-[500px]">
      <div className="flex justify-between items-center mb-6 border-b border-[#2b2d31] pb-4">
        <h3 className="text-2xl font-black text-white tracking-tighter">
          Toda tu Colección
        </h3>
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
            <div
              key={`${song.videoId}-${index}`}
              className="group flex items-center justify-between bg-[#1e1f22] p-3 rounded-2xl hover:bg-[#2b2d31] transition border border-transparent hover:border-[#3f4147]"
            >
              <div className="flex items-center gap-4 overflow-hidden">
                <span className="text-gray-600 font-black text-xs w-6 text-center">
                  {index + 1}
                </span>
                <div className="flex flex-col min-w-0">
                  <span className="font-bold text-white text-sm truncate group-hover:text-[#57F287] transition cursor-default">
                    {song.title}
                  </span>
                  <span className="text-gray-500 text-[10px] font-black uppercase truncate tracking-wider mt-0.5">
                    {song.artist}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleDelete(song.videoId)}
                  className="opacity-0 group-hover:opacity-100 p-2 text-gray-500 hover:text-red-500 transition-all transform hover:scale-110"
                  title="Eliminar de favoritos"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>

                <button
                  disabled={loadingTrackId === song.videoId}
                  onClick={() => handlePlay(song)}
                  className={`flex items-center justify-center min-w-[100px] px-4 py-2 rounded-xl font-black text-xs uppercase shadow-xl transition ${
                    loadingTrackId === song.videoId
                      ? "opacity-100 bg-[#3f4147] text-gray-400 cursor-not-allowed"
                      : "opacity-0 group-hover:opacity-100 bg-[#57F287] text-black hover:scale-105"
                  }`}
                >
                  {loadingTrackId === song.videoId ? (
                    <svg
                      className="animate-spin h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                  ) : (
                    "Reproducir"
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
