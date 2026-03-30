"use client";
import { signIn } from "next-auth/react";

export default function Login() {
  return (
    <main className="min-h-screen bg-[#0a0a0c] flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* Luces de fondo decorativas */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#5865F2] rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#57F287] rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-pulse delay-700"></div>

      <div className="bg-[#111214] border border-[#2b2d31] p-10 md:p-14 rounded-[3rem] shadow-2xl flex flex-col items-center max-w-md w-full text-center relative z-10">
        
        <div className="w-24 h-24 bg-gradient-to-br from-[#5865F2] to-[#57F287] rounded-3xl shadow-xl flex items-center justify-center mb-8 transform -rotate-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>
        </div>

        <h1 className="text-4xl font-black text-white tracking-tighter mb-3">Musicardi</h1>
        <p className="text-gray-400 text-sm font-medium mb-10">Inicia sesión para gestionar tu colección musical, estadísticas y controlar la reproducción en tiempo real.</p>

        <button 
        onClick={() => signIn('discord', { callbackUrl: '/dashboard' })} 
        className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white font-black uppercase tracking-widest py-4 px-6 rounded-2xl shadow-lg shadow-[#5865F2]/30 transition transform hover:scale-105 flex items-center justify-center gap-3"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 127.14 96.36" fill="currentColor"><path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a67.73,67.73,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.31,60,73.31,53s5-12.74,11.43-12.74S96.3,46,96.12,53,91.08,65.69,84.69,65.69Z"/></svg>
          Entrar con Discord
        </button>
      </div>
    </main>
  );
}