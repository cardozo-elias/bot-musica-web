"use client";
import React from "react";
import { useSocketStats } from "./SocketContext";

export default function AmbientBackground() {
  const { socketStats } = useSocketStats();
  const color = socketStats?.color || "#a855f7";

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10 bg-[#050508]">
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes aurora-blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(5vw, -5vh) scale(1.1); }
          66% { transform: translate(-4vw, 3vh) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        @keyframes twinkle {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 0.2; transform: scale(0.95); }
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
        }
        .animate-aurora {
          animation: aurora-blob 18s infinite alternate ease-in-out;
        }
        .delay-2000 { animation-delay: 2s; }
        .delay-4000 { animation-delay: 4s; }
      `}} />

      <div className="absolute inset-0 bg-stars mix-blend-screen"></div>

      <div
        className="absolute top-[-10%] left-[-10%] w-[60vw] h-[60vh] rounded-full mix-blend-screen blur-[100px] opacity-40 animate-aurora transition-colors duration-1000 ease-in-out"
        style={{ backgroundColor: color }}
      ></div>

      <div
        className="absolute top-[20%] right-[-10%] w-[50vw] h-[50vh] rounded-full mix-blend-screen blur-[120px] opacity-30 animate-aurora delay-2000 transition-colors duration-1000 ease-in-out"
        style={{ backgroundColor: color }}
      ></div>

      <div
        className="absolute bottom-[-20%] left-[20%] w-[60vw] h-[60vh] rounded-full mix-blend-screen blur-[100px] opacity-20 animate-aurora delay-4000 transition-colors duration-1000 ease-in-out"
        style={{ backgroundColor: color }}
      ></div>
      
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#050508]/60 to-[#050508]/95"></div>
    </div>
  );
}