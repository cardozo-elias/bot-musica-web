"use client";
import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";

export default function WebSearch({ userId, userName, userAvatar }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);

  const botUrl = process.env.NEXT_PUBLIC_BOT_URL || "http://localhost:3001";
  const socketRef = useRef(null);

  useEffect(() => {
    // Bypass de ngrok agregado aquí
    socketRef.current = io(botUrl, {
      extraHeaders: { "ngrok-skip-browser-warning": "true" }
    });
    
    socketRef.current.emit("cmd_get_recommendations", userId);
    socketRef.current.on("search_results", (videos) => { setResults(videos || []); setLoading(false); });
    socketRef.current.on("recommendations_results", (videos) => { setRecommendations(videos || []); });
    
    fetch("/api/playlists").then(res => res.json()).then(data => { if(Array.isArray(data)) setPlaylists(data); });
    
    return () => socketRef.current?.disconnect();
  }, [userId, botUrl]);

  const handleAddToPlaylist = async (playlistId, video) => {
    const songObj = { title: video.title, url: video.url, videoId: video.videoId, artist: String(video.author), thumbnail: video.thumbnail };
    await fetch("/api/playlists", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ playlistId, song: songObj }) });
    setOpenDropdown(null); alert("✅ Guardada.");
  };

  const VideoCard = ({ video }) => (
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between bg-[#1e1f22] p-4 rounded-2xl hover:bg-[#2b2d31] transition gap-4 border border-transparent hover:border-[#3f4147] shadow-lg">
      <div className="flex items-center gap-5 w-full md:w-auto overflow-hidden">
        <img src={video.thumbnail || video.image} alt="" className="w-16 h-16 rounded-xl object-cover shadow-2xl" />
        <div className="flex flex-col min-w-0 pr-4">
          <span className="font-bold text-white text-base line-clamp-1 group-hover:text-[#57F287] transition">{video.title}</span>
          <span className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">{String(video.author)} • {video.timestamp}</span>
        </div>
      </div>
      <div className="flex gap-3 w-full md:w-auto justify-end relative">
        <button onClick={() => socketRef.current?.emit("cmd_play_specific", { userId, video, userName, userAvatar })} className="bg-[#2b2d31] hover:bg-[#57F287] hover:text-black text-gray-300 px-6 py-2 rounded-xl font-black text-xs uppercase transition shadow-xl">▶ Cola</button>
        
        <button onClick={() => setOpenDropdown(openDropdown === video.videoId ? null : video.videoId)} className="bg-[#2b2d31] hover:bg-[#5865F2] text-white px-4 py-2 rounded-xl font-bold transition shadow-xl">
           <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
        </button>
        {openDropdown === video.videoId && (
          <div className="absolute right-0 top-14 w-64 bg-[#111214] border border-[#2b2d31] rounded-2xl shadow-2xl z-20 py-3 animate-fadeIn">
            <p className="text-[10px] text-gray-600 px-5 pb-2 border-b border-[#2b2d31] mb-2 uppercase font-black tracking-widest">Guardar en...</p>
            <div className="max-h-48 overflow-y-auto custom-scrollbar">
                {playlists.map(pl => (
                  <button key={pl.id} onClick={() => handleAddToPlaylist(pl.id, video)} className="w-full text-left px-5 py-3 text-xs font-bold text-gray-300 hover:bg-[#5865F2] hover:text-white transition truncate uppercase tracking-tighter">📁 {pl.name}</button>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="w-full bg-[#111214] p-6 md:p-10 rounded-3xl border border-[#2b2d31] shadow-2xl mb-8">
      <h3 className="text-2xl font-black mb-8 border-b border-[#2b2d31] pb-5 tracking-tighter">Buscador</h3>
      <form onSubmit={(e) => { 
          e.preventDefault(); 
          if(!query.trim()) return; 
          setLoading(true); 
          setResults([]); 
          socketRef.current?.emit("cmd_search", query); 
        }} className="flex gap-3 mb-10">
        <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="¿Qué quieres escuchar hoy?" className="flex-1 bg-[#1e1f22] border border-[#2b2d31] rounded-2xl px-6 py-4 text-white focus:border-[#5865F2] outline-none transition text-lg shadow-inner" />
        <button type="submit" className="bg-[#5865F2] px-10 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-[#4752C4] transition shadow-xl">Buscar</button>
      </form>
      <div className="flex flex-col gap-4">
        {loading ? (
            <p className="text-center py-10 font-black uppercase tracking-widest text-gray-600 animate-pulse">Buscando en YouTube...</p>
        ) : (
            (results.length > 0 ? results : recommendations).map((video) => <VideoCard key={video.videoId} video={video} />)
        )}
      </div>
    </div>
  );
}