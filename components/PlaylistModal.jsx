"use client";
import { useEffect, useState } from "react";

export default function PlaylistModal({ isOpen, onClose, onSelect }) {
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetch("/api/playlists")
        .then((res) => res.json())
        .then((data) => {
          setPlaylists(data);
          setLoading(false);
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-[#1e1f22] border border-[#2b2d31] w-full max-w-md rounded-xl shadow-2xl overflow-hidden">
        <div className="p-4 border-b border-[#2b2d31] flex justify-between items-center">
          <h3 className="font-bold text-lg">Añadir a Playlist</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-xl"
          >
            &times;
          </button>
        </div>
        <div className="p-2 max-h-60 overflow-y-auto">
          {loading ? (
            <p className="p-4 text-center text-gray-500">
              Cargando tus listas...
            </p>
          ) : playlists.length === 0 ? (
            <p className="p-4 text-center text-gray-500 text-sm">
              No tienes playlists creadas.
            </p>
          ) : (
            playlists.map((pl) => (
              <button
                key={pl.id}
                onClick={() => onSelect(pl.id)}
                className="w-full text-left p-3 hover:bg-[#2b2d31] rounded-lg transition mb-1 flex items-center gap-3"
              >
                <div className="w-10 h-10 bg-[#5865F2]/20 rounded flex items-center justify-center text-[#5865F2]">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                  </svg>
                </div>
                <div>
                  <p className="font-bold text-sm">{pl.name}</p>
                  <p className="text-[10px] text-gray-500 uppercase font-bold">
                    {pl.songs?.length || 0} canciones
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
