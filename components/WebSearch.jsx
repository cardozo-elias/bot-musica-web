"use client";
import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { useLanguage } from "./LanguageContext";

// 🔥 LA MAGIA: Esta función le avisa al componente que se abra desde cualquier lugar
export const openSearchModal = () => {
  if (typeof window !== "undefined") window.dispatchEvent(new Event("open-search-modal"));
};

// Íconos SVG
const CloseIcon = () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;
const SearchIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;
const LoadingSpinner = () => <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>;
const PlayIcon = () => <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>;
const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>;
const FolderIcon = () => <svg className="w-4 h-4 inline-block mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>;

export default function WebSearch({ userId, userName, userAvatar }) {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [loadingTrackId, setLoadingTrackId] = useState(null);

  const botUrl = process.env.NEXT_PUBLIC_BOT_URL || "http://localhost:3001";
  const socketRef = useRef(null);

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener("open-search-modal", handleOpen);
    return () => window.removeEventListener("open-search-modal", handleOpen);
  }, []);

  useEffect(() => {
    const botUrl = process.env.NEXT_PUBLIC_BOT_URL || "http://localhost:3001";
    
    // RESTAURADO A SU FORMA ORIGINAL
    socketRef.current = io(botUrl, { 
        extraHeaders: { "ngrok-skip-browser-warning": "true" } 
    });
    
    socketRef.current.emit("cmd_get_recommendations", userId);
    
    socketRef.current.on("search_results", (videos) => { 
        setResults(videos || []); 
        setLoading(false); 
    });
    
    socketRef.current.on("recommendations_results", (videos) => { 
        setRecommendations(videos || []); 
    });
    
    fetch("/api/playlists").then(res => res.json()).then(data => { 
        if(Array.isArray(data)) setPlaylists(data); 
    });
    
    return () => socketRef.current?.disconnect();
  }, [userId]);

  const handleAddToPlaylist = async (playlistId, video) => {
    const songObj = { 
      title: video.title, url: video.url, videoId: video.videoId, 
      artist: String(video.author), thumbnail: video.thumbnail, seconds: video.seconds, timestamp: video.timestamp
    };
    await fetch("/api/playlists", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ playlistId, song: songObj }) });
    setOpenDropdown(null); 
    alert(t('webSearch.savedAlert'));
  };

  const handlePlaySubmit = (e) => {
    e.preventDefault(); 
    if(!query.trim()) return; 
    setLoading(true); setResults([]); 
    socketRef.current?.emit("cmd_search", query); 
  };

  const VideoCard = ({ video }) => (
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between bg-black/20 p-4 rounded-2xl hover:bg-black/40 transition gap-4 border border-white/5 hover:border-[#7e22ce]/50 shadow-md group">
      <div className="flex items-center gap-4 w-full md:w-auto overflow-hidden">
        <img src={video.thumbnail || video.image} alt="cover" className="w-14 h-14 md:w-16 md:h-16 rounded-xl object-cover shadow-lg shrink-0" />
        <div className="flex flex-col min-w-0 pr-2">
          <span className="font-bold text-white text-sm md:text-base line-clamp-1 group-hover:text-[#a855f7] transition-colors">{video.title}</span>
          <span className="text-[10px] md:text-xs text-gray-500 font-bold uppercase tracking-widest mt-1 truncate">{String(video.author)} • {video.timestamp}</span>
        </div>
      </div>
      <div className="flex items-center gap-2 w-full md:w-auto justify-end mt-2 md:mt-0 relative">
        <button 
          disabled={loadingTrackId === video.videoId}
          onClick={() => {
            setLoadingTrackId(video.videoId);
            socketRef.current?.emit("cmd_play_specific", { userId, video, userName, userAvatar });
            setTimeout(() => { setLoadingTrackId(null); setIsOpen(false); }, 1500); 
          }} 
          className={`flex items-center justify-center gap-1.5 min-w-[90px] px-4 py-2 rounded-xl font-bold text-xs uppercase transition shadow-md ${loadingTrackId === video.videoId ? 'bg-white/5 text-gray-500 cursor-not-allowed' : 'bg-white/10 hover:bg-[#7e22ce] hover:text-white text-gray-300'}`}
        >
          {loadingTrackId === video.videoId ? <LoadingSpinner /> : <><PlayIcon /> {t('webSearch.addToQueue')}</>}
        </button>
        <button onClick={() => setOpenDropdown(openDropdown === video.videoId ? null : video.videoId)} className="bg-white/10 hover:bg-[#7e22ce] text-white px-3 py-2 rounded-xl font-bold transition shadow-md">
           <PlusIcon />
        </button>
        {openDropdown === video.videoId && (
          <div className="absolute right-0 top-12 w-56 bg-[#0a0a0c]/95 backdrop-blur-xl border border-[#7e22ce]/30 rounded-2xl shadow-2xl z-20 py-3 animate-fadeIn">
            <p className="text-[9px] text-[#a855f7] px-4 pb-2 border-b border-white/10 mb-2 uppercase font-black tracking-widest text-center">{t('webSearch.saveTo')}</p>
            <div className="max-h-48 overflow-y-auto custom-scrollbar flex flex-col gap-1 px-2">
                {playlists.map(pl => (
                  <button 
                    key={pl.id} 
                    onClick={() => handleAddToPlaylist(pl.id, video)} 
                    className="w-full text-left px-3 py-2.5 text-[11px] font-bold text-gray-300 hover:bg-[#7e22ce]/40 hover:text-white rounded-lg transition truncate tracking-wide"
                  >
                    <FolderIcon /> {pl.name}
                  </button>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-[#0a0a0c]/80 backdrop-blur-sm flex items-start justify-center pt-10 md:pt-20 px-4 animate-fadeIn">
      <div className="w-full max-w-2xl glass-panel bg-[#111214]/95 rounded-3xl shadow-2xl relative flex flex-col max-h-[85vh] border border-[#7e22ce]/30">
        
        <div className="flex justify-between items-center p-6 border-b border-white/5 shrink-0 bg-black/20 rounded-t-3xl">
          <div className="flex flex-col">
              <h3 className="text-xl font-black tracking-tight text-white flex items-center gap-3">
                <SearchIcon /> {t('webSearch.title')}
              </h3>
          </div>
          <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-white transition"><CloseIcon /></button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-black/10 rounded-b-3xl">
          <form onSubmit={handlePlaySubmit} className="flex flex-col md:flex-row gap-3 mb-8">
            <div className="relative flex-1 group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500 group-focus-within:text-[#a855f7] transition-colors">
                    <SearchIcon />
                </div>
                <input 
                  autoFocus 
                  type="text" 
                  value={query} 
                  onChange={(e) => setQuery(e.target.value)} 
                  placeholder={t('webSearch.placeholder')} 
                  className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-3 text-white focus:border-[#7e22ce]/50 outline-none transition text-sm shadow-inner" 
                />
            </div>
            <button 
              type="submit" 
              disabled={loading || !query.trim()} 
              className="bg-gradient-to-r from-[#a855f7] to-[#7e22ce] text-white px-8 py-3 rounded-2xl font-black uppercase text-[11px] tracking-widest hover:brightness-110 transition shadow-lg disabled:opacity-50 flex items-center justify-center min-w-[120px]"
            >
                {loading ? <LoadingSpinner /> : t('webSearch.btnSearch')}
            </button>
          </form>
          
          <div className="flex flex-col gap-3">
            {loading ? (
                <p className="text-center py-8 font-black uppercase tracking-widest text-[#a855f7] animate-pulse text-[10px]">{t('webSearch.loading')}</p>
            ) : (
                results.map((video) => <VideoCard key={video.videoId} video={video} />)
            )}
          </div>
        </div>

      </div>
    </div>
  );
}