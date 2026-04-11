import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "../components/LanguageContext";
import { cookies } from "next/headers";

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
  // Leemos la cookie desde el servidor para establecer el idioma inicial sin parpadeos
  const cookieStore = await cookies();
  const locale = cookieStore.get('locale')?.value || 'es';

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* Envolvemos la app en el proveedor de idiomas para que todos los componentes tengan acceso */}
        <LanguageProvider initialLang={locale}>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}