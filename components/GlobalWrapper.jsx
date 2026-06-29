"use client";
import { SessionProvider, useSession } from "next-auth/react";
import LivePlayer from "./LivePlayer";
import SettingsModal from "./SettingsModal";
import { SocketProvider } from "./SocketContext";
import AmbientBackground from "./AmbientBackground";

function PlayerInjector({ children }) {
  const { data: session } = useSession();

  return (
    <SocketProvider>
      <AmbientBackground />
      {children}

      {session?.user?.id && (
        <LivePlayer userId={session.user.id} guildId={null} />
      )}

      <SettingsModal />
    </SocketProvider>
  );
}

export default function GlobalWrapper({ children }) {
  return (
    <SessionProvider>
      <PlayerInjector>{children}</PlayerInjector>
    </SessionProvider>
  );
}