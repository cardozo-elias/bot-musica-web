import { getServerSession } from "next-auth/next";
import { authOptions } from "../../api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { Pool } from 'pg';
import Link from "next/link";
import { cookies } from "next/headers";
import { dictionaries } from "../../../utils/dictionary";

import PlaylistDetailClient from "../[id]/PlaylistDetailClient";
import { SocketProvider } from "../../../components/SocketContext";
import LivePlayer from "../../../components/LivePlayer";
import MobileNav from "../../../components/MobileNav";
import SearchTrigger from "../../../components/SearchTrigger";
import SettingsTrigger from "../../../components/SettingsTrigger";
import WebSearch from "../../../components/WebSearch";
import SettingsModal from "../../../components/SettingsModal";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export default async function LikesPlaylistPage() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) redirect('/login');

  const cookieStore = await cookies();
  const locale = cookieStore.get('locale')?.value || 'es';
  const dict = dictionaries[locale] || dictionaries['es'];

  let likedSongs = [];
  let userPlaylists = [];

  try {
    const likesRes = await pool.query('SELECT title, artist, video_id as "videoId" FROM likes WHERE user_id = $1 ORDER BY id DESC', [session.user.id]);
    likedSongs = likesRes.rows.map(row => ({
      title: row.title, artist: row.artist, videoId: row.videoId,
      thumbnail: `https://img.youtube.com/vi/${row.videoId}/hqdefault.jpg`,
      requester: session.user.name, requesterAvatar: session.user.image, url: `https://www.youtube.com/watch?v=${row.videoId}`
    }));

    const allPlRes = await pool.query('SELECT id, name FROM user_playlists WHERE user_id = $1 ORDER BY id DESC', [session.user.id]);
    userPlaylists = allPlRes.rows;
  } catch (e) {
    console.error(e);
  }

  const pseudoPlaylist = { id: "likes", name: dict.nav.likes, is_public: false, songs: likedSongs };

  return (
    <SocketProvider>
      <main className="h-screen bg-transparent text-white flex overflow-hidden font-sans">
        
        
        <aside className="w-[280px] bg-[#0a0a0c]/80 backdrop-blur-xl border-r border-[#1e1f22] flex flex-col pt-8 pb-28 z-10 shadow-[4px_0_24px_rgba(0,0,0,0.5)] shrink-0 hidden md:flex">
          <div className="px-4 flex flex-col gap-2 mb-8">
            <Link href={`/dashboard/${session.user.id}`} className="flex items-center gap-3 px-4 py-2.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg font-bold text-sm transition">
               <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
               {dict.nav.home}
            </Link>
            
            <SearchTrigger />

            <Link href="/playlists" className="flex items-center gap-3 px-4 py-2.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg font-bold text-sm transition mt-1">
               <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" /></svg>
               {dict.nav.playlists}
            </Link>
          </div>

          <Link href="/playlists/likes" className="flex items-center gap-3 px-4 py-2.5 mx-4 bg-gradient-to-r from-[#a855f7]/20 to-[#7e22ce]/20 text-white rounded-lg text-sm transition font-bold border border-[#7e22ce]/30 shadow-inner">
            <svg className="w-5 h-5 text-[#a855f7]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
            {dict.nav.likes}
          </Link>

          <div className="px-4 mt-6 flex flex-col gap-1 flex-1 overflow-y-auto custom-scrollbar">
            {userPlaylists.map(pl => (
              <Link key={pl.id} href={`/playlists/${pl.id}`} className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition truncate text-gray-400 hover:text-[#a855f7] hover:bg-white/5 font-medium">
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
                {pl.name}
              </Link>
            ))}
          </div>

          <div className="px-4 border-t border-[#1e1f22] pt-4 mb-2">
            <SettingsTrigger />
            <div className="flex items-center gap-4 mt-4 px-2">
                <img src={session.user.image} className="w-10 h-10 rounded-full border border-[#a855f7]/50" alt="Avatar" />
                <div className="flex flex-col min-w-0">
                    <span className="text-sm font-bold truncate text-gray-200">{session.user.name}</span>
                    <a href="/api/auth/signout" className="text-[10px] text-gray-500 hover:text-red-400 font-bold uppercase tracking-wider transition">{dict.nav.logout}</a>
                </div>
            </div>
          </div>
        </aside>

        <PlaylistDetailClient playlist={pseudoPlaylist} session={session} isOwner={true} isLikesPlaylist={true} />

        <WebSearch userId={session.user.id} userName={session.user.name} userAvatar={session.user.image} />
        <SettingsModal />
        <MobileNav userId={session.user.id} />
        <LivePlayer userId={session.user.id} />

      </main>
    </SocketProvider>
  );
}