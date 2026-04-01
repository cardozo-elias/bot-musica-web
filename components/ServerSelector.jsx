"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { io } from "socket.io-client";

export default function ServerSelector({ userId, currentGuildId }) {
  const [guilds, setGuilds] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    if (!userId) return;

    const botUrl = process.env.NEXT_PUBLIC_BOT_URL || "http://localhost:3001";
    const socket = io(botUrl, { extraHeaders: { "ngrok-skip-browser-warning": "true" } });

    // Pedimos la lista de servidores compartidos
    socket.emit("get_user_guilds", userId);

    socket.on("user_guilds_result", (data) => {
      setGuilds(data || []);
      setLoading(false);
    });

    return () => socket.disconnect();
  }, [userId]);

  // Cierra el menú si haces clic afuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Encontramos el servidor actual para mostrarlo en el botón
  const currentGuild = guilds.find((g) => g.id === currentGuildId);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 bg-[#1e1f22] hover:bg-[#2b2d31] border border-[#2b2d31] px-4 py-2.5 rounded-xl transition-all shadow-lg min-w-[220px] justify-between"
      >
        <div className="flex items-center gap-3 overflow-hidden">
          {loading ? (
            <div className="w-6 h-6 rounded-full bg-[#2b2d31] animate-pulse"></div>
          ) : currentGuild?.icon ? (
            <img src={currentGuild.icon} alt="Server" className="w-6 h-6 rounded-full object-cover shadow-sm" />
          ) : (
            <div className="w-6 h-6 rounded-full bg-[#5865F2] flex items-center justify-center text-white text-[10px] font-black">
              {currentGuild?.name?.charAt(0) || "?"}
            </div>
          )}
          <span className="font-bold text-sm text-gray-200 truncate max-w-[120px]">
            {loading ? "Cargando..." : currentGuild?.name || "Seleccionar Servidor"}
          </span>
        </div>
        <svg className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-[260px] bg-[#111214] border border-[#2b2d31] rounded-2xl shadow-2xl z-[100] py-2 animate-fadeIn overflow-hidden">
          <p className="text-[10px] text-gray-500 px-4 pb-2 border-b border-[#2b2d31] mb-2 uppercase font-black tracking-widest">
            Tus Servidores ({guilds.length})
          </p>
          
          <div className="max-h-[300px] overflow-y-auto custom-scrollbar flex flex-col px-2 gap-1">
            {guilds.map((guild) => (
              <button
                key={guild.id}
                onClick={() => {
                  setIsOpen(false);
                  // La magia de Next.js: te lleva al panel de ese servidor sin recargar todo feo
                  router.push(`/dashboard/${guild.id}`);
                }}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all w-full text-left ${
                  guild.id === currentGuildId
                    ? "bg-[#5865F2]/10 border border-[#5865F2]/30 text-white"
                    : "hover:bg-[#1e1f22] text-gray-400 hover:text-white border border-transparent"
                }`}
              >
                {guild.icon ? (
                  <img src={guild.icon} alt="Server" className="w-8 h-8 rounded-full object-cover shadow-sm flex-shrink-0" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[#2b2d31] flex items-center justify-center text-white text-xs font-black flex-shrink-0">
                    {guild.name.charAt(0)}
                  </div>
                )}
                <span className="font-bold text-sm truncate flex-1">{guild.name}</span>
                
                {/* Un check verde si es el servidor actual */}
                {guild.id === currentGuildId && (
                  <svg className="w-4 h-4 text-[#57F287] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            ))}
            
            {guilds.length === 0 && !loading && (
              <div className="px-4 py-6 text-center text-gray-500 text-xs font-bold">
                No tienes servidores en común con el bot.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}