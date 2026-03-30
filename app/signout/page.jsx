"use client";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function SignOutPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-[#0a0a0c] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#da373c] rounded-full mix-blend-multiply filter blur-[128px] opacity-10 animate-pulse"></div>

      <div className="bg-[#111214] border border-[#2b2d31] p-10 rounded-[3rem] shadow-2xl flex flex-col items-center max-w-md w-full text-center relative z-10">
        
        <div className="w-20 h-20 bg-[#da373c]/10 rounded-full flex items-center justify-center mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-[#da373c]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
        </div>

        <h1 className="text-3xl font-black text-white tracking-tighter mb-2">¿Cerrar sesión?</h1>
        <p className="text-gray-400 text-sm font-medium mb-8">Se desconectará tu cuenta de Discord de este navegador.</p>

        <div className="flex gap-4 w-full">
            <button 
                onClick={() => router.back()} 
                className="flex-1 bg-[#2b2d31] hover:bg-[#3f4147] text-white font-bold py-4 px-6 rounded-2xl transition"
            >
              Cancelar
            </button>
            <button 
                onClick={() => signOut({ callbackUrl: '/' })} 
                className="flex-1 bg-[#da373c] hover:bg-[#c92f33] text-white font-bold py-4 px-6 rounded-2xl shadow-lg shadow-[#da373c]/20 transition"
            >
              Salir
            </button>
        </div>
      </div>
    </main>
  );
}