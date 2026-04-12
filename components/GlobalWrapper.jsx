"use client";
import { SessionProvider, useSession } from "next-auth/react";
import LivePlayer from "./LivePlayer";
import SettingsModal from "./SettingsModal"; // 👇 Importamos el modal
import { SocketProvider } from "./SocketContext";

function PlayerInjector({ children }) {
  const { data: session } = useSession();
  
  return (
    <SocketProvider>
      {children}
      {/* El reproductor flotante */}
      {session?.user?.id && <LivePlayer userId={session.user.id} guildId={null} />}
      
      {/* 👇 El modal de Ajustes oculto, esperando a ser llamado 👇 */}
      <SettingsModal />
    </SocketProvider>
  );
}

export default function GlobalWrapper({ children }) {
  return (
    <SessionProvider>
      <PlayerInjector>
        {children}
      </PlayerInjector>
    </SessionProvider>
  );
}