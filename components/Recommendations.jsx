'use client';
import { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useLanguage } from './LanguageContext';

const LoadingSpinner = () => <svg className="animate-spin h-4 w-4 text-[#a855f7]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>;

export default function Recommendations({ userId, userName, userAvatar }) {
  const { t } = useLanguage();
  const [recs, setRecs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingTrackId, setLoadingTrackId] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    const botUrl = process.env.NEXT_PUBLIC_BOT_URL || "http://localhost:3001";
    socketRef.current = io(botUrl, { extraHeaders: { "ngrok-skip-browser-warning": "true" } });
    
    socketRef.current.on('connect', () => socketRef.current.emit('get_recommendations', userId));
    socketRef.current.on('recommendations_data', (data) => {
      setRecs(data.tracks || []);
      setLoading(false);
    });
    return () => socketRef.current?.disconnect();
  }, [userId]);

  const play = (track) => {
    if (loadingTrackId === track.videoId) return;
    setLoadingTrackId(track.videoId); 
    socketRef.current?.emit('cmd_play_specific', { userId, video: track, userName, userAvatar });
    setTimeout(() => setLoadingTrackId(null), 1500); 
  };

  if (loading) return (
    <div className="glass-panel p-6 rounded-3xl border border-white/5 animate-pulse w-full h-[550px]">
        <div className="h-6 w-48 bg-white/10 rounded mb-6"></div>
        {[1,2,3,4,5].map(i => <div key={i} className="h-14 bg-black/20 rounded-xl mb-3"></div>)}
    </div>
  );

  if (!recs.length) return null;

  return (
    <div className="w-full glass-panel p-6 md:p-8 rounded-3xl border border-white/5 shadow-lg flex flex-col h-[550px]">
      <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
        <div className="min-w-0 pr-2 flex flex-col">
            <h3 className="text-xl md:text-2xl font-black text-white tracking-tighter">{t('dashboard.recommendations.title')}</h3>
            <span className="text-xs text-gray-500 font-medium">{t('dashboard.recommendations.subtitle')}</span>
        </div>
        <button 
          onClick={() => { setLoading(true); socketRef.current?.emit('get_recommendations', userId); }}
          className="text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-xl text-[10px] font-black uppercase transition flex-shrink-0 shadow-sm"
        >
          {t('dashboard.recommendations.refresh')}
        </button>
      </div>
      
      <div className="flex flex-col gap-2 overflow-y-auto custom-scrollbar flex-1 pr-2">
        {recs.map((track) => (
          <div 
            key={track.videoId} 
            onClick={() => play(track)}
            className={`group flex items-center gap-4 p-2.5 rounded-2xl transition-all border border-transparent 
              ${loadingTrackId === track.videoId ? 'opacity-50 pointer-events-none' : 'bg-black/20 hover:bg-black/40 cursor-pointer hover:border-[#a855f7]/30 shadow-sm'}`}
          >
            <div className="relative h-12 w-12 flex-shrink-0">
                <img src={track.thumbnail} className="rounded-xl object-cover h-full w-full shadow-md" alt="" />
                
                <div className={`absolute inset-0 bg-black/60 flex items-center justify-center transition rounded-xl ${loadingTrackId === track.videoId ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                    {loadingTrackId === track.videoId ? <LoadingSpinner /> : <span className="text-white text-xs">▶</span>}
                </div>
            </div>
            <div className="flex flex-col min-w-0 flex-1 pr-2">
              <p className="text-sm font-bold text-white truncate group-hover:text-[#a855f7] transition">{track.title}</p>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest truncate mt-0.5">{String(track.author)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}