"use client";
import { SessionProvider, useSession } from "next-auth/react";
import LivePlayer from "./LivePlayer";
import { SocketStatsProvider } from "./SocketContext";

function PlayerInjector({ children }) {
  const { data: session } = useSession();
  
  return (
    <SocketStatsProvider>
      {children}
      {/* Si el usuario tiene sesión, el reproductor flotará mágicamente sobre toda la app */}
      {session?.user?.id && <LivePlayer userId={session.user.id} guildId={null} />}
    </SocketStatsProvider>
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