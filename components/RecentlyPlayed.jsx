"use client";
import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import { useLanguage } from "./LanguageContext";

const LoadingSpinner = () => (
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
);
const MusicIcon = () => (
  <svg
    className="w-4 h-4 mx-auto"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
    />
  </svg>
);

export default function RecentlyPlayed({
  history: initialHistory,
  userId,
  userName,
  userAvatar,
}) {
  const { t, lang } = useLanguage();
  const [history, setHistory] = useState(initialHistory || []);
  const [loadingTrackId, setLoadingTrackId] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    const botUrl = process.env.NEXT_PUBLIC_BOT_URL || "http://localhost:3001";
    socketRef.current = io(botUrl, {
      extraHeaders: { "ngrok-skip-browser-warning": "true" },
    });

    socketRef.current.on("history_updated", (data) => {
      if (data.userId === userId) {
        setHistory((prev) => {
          const filtered = prev.filter((s) => s.videoId !== data.videoId);
          return [data, ...filtered].slice(0, 30);
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
      userAvatar,
    });
    setTimeout(() => setLoadingTrackId(null), 1500);
  };

  const timeAgo = (dateString) => {
    const seconds = Math.floor((new Date() - new Date(dateString)) / 1000);
    if (lang === "en") {
      if (seconds < 60) return "just now";
      if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
      if (seconds < 86400) return `${Math.floor(seconds / 3600)} h ago`;
      return `${Math.floor(seconds / 86400)} days ago`;
    }
    if (seconds < 60) return "hace instantes";
    if (seconds < 3600) return `hace ${Math.floor(seconds / 60)} min`;
    if (seconds < 86400) return `hace ${Math.floor(seconds / 3600)} h`;
    return `hace ${Math.floor(seconds / 86400)} días`;
  };

  return (
    <div className="w-full glass-panel p-6 md:p-8 rounded-3xl border border-white/5 shadow-lg flex flex-col h-[550px]">
      <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
        <div className="flex flex-col">
          <h3 className="text-xl md:text-2xl font-black text-white tracking-tighter">
            {t("dashboard.recent.title")}
          </h3>
          <span className="text-xs text-gray-500 font-medium">
            {t("dashboard.recent.subtitle")}
          </span>
        </div>
      </div>

      {history.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 text-center opacity-50">
          <p className="text-gray-400 font-bold mb-2">
            {t("dashboard.recent.empty")}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2 overflow-y-auto custom-scrollbar pr-2 flex-1">
          {history.map((song, index) => (
            <div
              key={`${song.videoId}-${index}`}
              className="group flex items-center justify-between bg-black/20 p-3 rounded-2xl hover:bg-black/40 transition border border-transparent hover:border-[#a855f7]/30"
            >
              <div className="flex items-center gap-4 overflow-hidden">
                <span className="text-gray-600 font-black text-xs w-8 text-center group-hover:text-[#a855f7] transition-colors">
                  <MusicIcon />
                </span>
                <div className="flex flex-col min-w-0">
                  <span className="font-bold text-white text-sm truncate group-hover:text-[#a855f7] transition cursor-default">
                    {song.title}
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-gray-500 text-[10px] font-black uppercase truncate tracking-wider">
                      {song.artist}
                    </span>
                    <span className="text-gray-600 text-[10px]">&bull;</span>
                    <span className="text-gray-600 text-[10px] font-bold">
                      {timeAgo(song.playedAt)}
                    </span>
                  </div>
                </div>
              </div>
              <div>
                <button
                  disabled={loadingTrackId === song.videoId}
                  onClick={() => handlePlay(song)}
                  className={`flex items-center justify-center min-w-[90px] px-4 py-2 rounded-xl font-bold text-[10px] uppercase shadow-md transition ${loadingTrackId === song.videoId ? "opacity-100 bg-white/5 text-gray-400 cursor-not-allowed" : "opacity-0 group-hover:opacity-100 bg-white/10 text-white hover:bg-[#a855f7]"}`}
                >
                  {loadingTrackId === song.videoId ? (
                    <LoadingSpinner />
                  ) : (
                    t("player.play")
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
