'use client';
import { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';

export default function Recommendations({ userId, userName, userAvatar }) {
  const [recs, setRecs] = useState([]);
  const [seed, setSeed] = useState('');
  const [loading, setLoading] = useState(true);
  const socketRef = useRef(null);

  useEffect(() => {
    const botUrl = process.env.NEXT_PUBLIC_BOT_URL || "http://localhost:3001";
    // Bypass de ngrok agregado aquí
    socketRef.current = io(botUrl, {
      extraHeaders: { "ngrok-skip-browser-warning": "true" }
    });
    socketRef.current.on('connect', () => socketRef.current.emit('get_recommendations', userId));
    
    socketRef.current.on('recommendations_data', (data) => {
      setRecs(data.tracks || []);
      setSeed(data.seed || '');
      setLoading(false);
    });

    return () => socketRef.current?.disconnect();
  }, [userId]);

  const play = (track) => {
    socketRef.current?.emit('cmd_play_specific', { userId, video: track, userName, userAvatar });
  };

  if (loading) return (
    <div className="bg-[#111214] p-6 rounded-xl border border-[#2b2d31] animate-pulse w-full">
        <div className="h-4 w-32 bg-[#2b2d31] rounded mb-6"></div>
        {[1,2,3,4,5].map(i => <div key={i} className="h-16 bg-[#1e1f22] rounded-xl mb-3"></div>)}
    </div>
  );

  if (!recs.length) return null;

  return (
    <div className="bg-[#111214] rounded-xl border border-[#2b2d31] shadow-2xl flex flex-col h-[550px] w-full">
      <div className="p-4 border-b border-[#2b2d31] flex justify-between items-center bg-[#161719] rounded-t-xl">
        <div className="min-w-0 pr-2">
            <h3 className="font-black text-[12px] uppercase tracking-widest text-white">Mix Personal</h3>
            <p className="text-[10px] text-[#57F287] font-bold truncate">vía {seed}</p>
        </div>
        <button 
          onClick={() => { setLoading(true); socketRef.current?.emit('get_recommendations', userId); }}
          className="text-gray-400 hover:text-white bg-[#2b2d31] hover:bg-[#3f4147] px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition flex-shrink-0"
        >
          Actualizar
        </button>
      </div>
      
      <div className="flex flex-col p-2 gap-1 overflow-y-auto custom-scrollbar flex-1">
        {recs.map((track) => (
          <div 
            key={track.videoId} 
            onClick={() => play(track)}
            className="group flex items-center gap-3 p-2 rounded-lg hover:bg-[#1e1f22] transition-all cursor-pointer border border-transparent hover:border-[#3f4147]"
          >
            <div className="relative h-12 w-12 flex-shrink-0">
                <img src={track.thumbnail} className="rounded-md object-cover h-full w-full shadow-sm" alt="" />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition rounded-md">
                    <span className="text-white text-xs">▶</span>
                </div>
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <p className="text-sm font-bold text-white truncate group-hover:text-[#57F287] transition">{track.title}</p>
              <p className="text-[10px] text-gray-500 font-bold uppercase truncate mt-0.5">{String(track.author)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}