import { getServerSession } from "next-auth/next";
import { authOptions } from "./api/auth/[...nextauth]/route";
import { cookies } from "next/headers";
import { dictionaries } from "../utils/dictionary";
import Link from "next/link";

const DiscordIcon = () => <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"/></svg>;
const PanelIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>;

export default async function LandingPage() {
  
  let session = null;
  try {
    session = await getServerSession(authOptions);
  } catch (e) {
    console.error("Error de sesión:", e);
  }

  
  let locale = 'es';
  try {
    const cookieStore = await cookies();
    locale = cookieStore.get('locale')?.value || 'es';
  } catch (e) {
    console.error("Error de cookie:", e);
  }

  
  const dict = dictionaries[locale] || dictionaries['es'] || {};
  const landingTexts = dict.landing || {
    subtitle: "El bot de música definitivo para Discord. Audio de alta fidelidad, algoritmo de Autoplay adaptativo y un panel web en tiempo real.",
    enter: "Entrar al Panel",
    login: "Iniciar Sesión",
    invite: "Invitar al Servidor",
    footer: "© 2026 Musicardi Team • Built with Next.js"
  };

  return (
    <main className="min-h-screen bg-[#0a0a0c] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#a855f7]/15 via-transparent to-transparent -z-10"></div>

      <div className="text-center max-w-2xl animate-slideUp">
        <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-[#a855f7]">
          Musicardi
        </h1>
        <p className="text-gray-400 text-lg md:text-xl font-medium mb-12 leading-relaxed">
          {landingTexts.subtitle}
        </p>

        <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
          
          <Link 
            href={session ? `/dashboard/${session.user.id}` : "/login"} 
            className="flex items-center gap-3 bg-gradient-to-r from-[#a855f7] to-[#7e22ce] text-white px-10 py-4 rounded-2xl font-black uppercase text-sm tracking-widest transition-all transform hover:scale-105 shadow-[0_0_30px_rgba(168,85,247,0.4)] hover:brightness-110 w-full md:w-auto justify-center"
          >
            {session ? <PanelIcon /> : <DiscordIcon />}
            {session ? landingTexts.enter : landingTexts.login}
          </Link>

          <a 
            href="https://discord.com/api/oauth2/authorize?client_id=TU_CLIENT_ID&permissions=8&scope=bot%20applications.commands" 
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 bg-white/5 border border-white/10 hover:bg-white/10 text-white px-10 py-4 rounded-2xl font-black uppercase text-sm tracking-widest transition-all transform hover:scale-105 w-full md:w-auto justify-center"
          >
            {landingTexts.invite}
          </a>
        </div>
      </div>

      <footer className="absolute bottom-8 text-gray-600 text-[10px] font-black uppercase tracking-[0.3em]">
        {landingTexts.footer}
      </footer>
    </main>
  );
}