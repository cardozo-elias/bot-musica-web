"use client";
import React, { useEffect } from "react";
import { useSocketStats } from "./SocketContext";

export default function AmbientBackground() {
  const { socketStats } = useSocketStats();
  const color = socketStats?.color || "#a855f7";

  useEffect(() => {
    const hex = color.replace("#", "");
    let r = 0, g = 0, b = 0;
    
    if (hex.length === 3) {
      r = parseInt(hex[0] + hex[0], 16);
      g = parseInt(hex[1] + hex[1], 16);
      b = parseInt(hex[2] + hex[2], 16);
    } else if (hex.length === 6) {
      r = parseInt(hex.substring(0, 2), 16);
      g = parseInt(hex.substring(2, 4), 16);
      b = parseInt(hex.substring(4, 6), 16);
    }

    const darkR = Math.floor(r * 0.6);
    const darkG = Math.floor(g * 0.6);
    const darkB = Math.floor(b * 0.6);

    const root = document.documentElement;
    root.style.setProperty("--dynamic-color", color);
    root.style.setProperty("--dynamic-color-15", `rgba(${r}, ${g}, ${b}, 0.15)`);
    root.style.setProperty("--dynamic-color-30", `rgba(${r}, ${g}, ${b}, 0.3)`);
    root.style.setProperty("--dynamic-color-40", `rgba(${r}, ${g}, ${b}, 0.4)`);
    root.style.setProperty("--dynamic-color-50", `rgba(${r}, ${g}, ${b}, 0.5)`);
    root.style.setProperty("--dynamic-color-dark", `rgb(${darkR}, ${darkG}, ${darkB})`);
  }, [color]);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10 bg-[#050508]">
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes aurora-blob {
          /* Usamos translate3d para forzar la aceleración por hardware (GPU) */
          0% { transform: translate3d(0vw, 0vh, 0) scale(1); }
          33% { transform: translate3d(12vw, -15vh, 0) scale(1.4); }
          66% { transform: translate3d(-10vw, 15vh, 0) scale(0.85); }
          100% { transform: translate3d(0vw, 0vh, 0) scale(1); }
        }
        @keyframes twinkle {
          0%, 100% { opacity: 0.7; transform: translate3d(0,0,0) scale(1); }
          50% { opacity: 0.3; transform: translate3d(0,0,0) scale(0.95); }
        }
        .bg-stars {
          background-image: 
            radial-gradient(1px 1px at 15px 25px, #ffffff, rgba(0,0,0,0)),
            radial-gradient(1.5px 1.5px at 75px 65px, rgba(255,255,255,0.9), rgba(0,0,0,0)),
            radial-gradient(1px 1px at 145px 115px, #ffffff, rgba(0,0,0,0)),
            radial-gradient(2px 2px at 215px 35px, rgba(255,255,255,0.7), rgba(0,0,0,0)),
            radial-gradient(1px 1px at 275px 175px, #ffffff, rgba(0,0,0,0)),
            radial-gradient(1.5px 1.5px at 335px 85px, rgba(255,255,255,0.5), rgba(0,0,0,0)),
            radial-gradient(2px 2px at 400px 220px, rgba(255,255,255,0.8), rgba(0,0,0,0));
          background-repeat: repeat;
          background-size: 450px 450px;
          animation: twinkle 7s ease-in-out infinite;
          will-change: opacity, transform;
        }
        .animate-aurora {
          animation: aurora-blob 18s infinite alternate ease-in-out;
          will-change: transform;
        }
        .delay-2000 { animation-delay: 2s; }
        .delay-4000 { animation-delay: 4s; }
      `}} />

      <div className="absolute inset-0 bg-stars mix-blend-screen transform-gpu"></div>

      <div
        className="absolute top-[-10%] left-[-10%] w-[60vw] h-[60vh] rounded-full mix-blend-screen blur-[120px] opacity-40 animate-aurora transition-colors duration-1000 ease-in-out transform-gpu"
        style={{ backgroundColor: 'var(--dynamic-color)' }}
      ></div>

      <div
        className="absolute top-[20%] right-[-10%] w-[50vw] h-[50vh] rounded-full mix-blend-screen blur-[140px] opacity-30 animate-aurora delay-2000 transition-colors duration-1000 ease-in-out transform-gpu"
        style={{ backgroundColor: 'var(--dynamic-color)' }}
      ></div>

      <div
        className="absolute bottom-[-20%] left-[20%] w-[60vw] h-[60vh] rounded-full mix-blend-screen blur-[120px] opacity-20 animate-aurora delay-4000 transition-colors duration-1000 ease-in-out transform-gpu"
        style={{ backgroundColor: 'var(--dynamic-color)' }}
      ></div>
      
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#050508]/60 to-[#050508]/95 transform-gpu"></div>
    </div>
  );
}