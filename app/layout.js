import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "../components/LanguageContext";
import { SocketStatsProvider } from "../components/SocketContext"; // 👇 Importamos el contexto de Sockets
import LivePlayer from "../components/LivePlayer"; // 👇 Importamos el reproductor
import { cookies } from "next/headers";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./api/auth/[...nextauth]/route";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Musicardi | Tu Panel de Música",
  description: "El bot de música definitivo para Discord con panel web en tiempo real.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default async function RootLayout({ children }) {
  // Leemos la cookie desde el servidor
  const cookieStore = await cookies();
  const locale = cookieStore.get('locale')?.value || 'es';
  
  // Obtenemos la sesión del usuario
  const session = await getServerSession(authOptions);

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#0a0a0c]">
        <LanguageProvider initialLang={locale}>
          {/* Envolvemos todo en el proveedor de Sockets para que el reproductor y el Dashboard compartan datos */}
          <SocketStatsProvider>
            
            {children}

            {/* 🔥 LA MAGIA: El reproductor global que te sigue a todos lados 🔥 */}
            {session && session.user && (
              <LivePlayer userId={session.user.id} guildId={null} />
            )}

          </SocketStatsProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}