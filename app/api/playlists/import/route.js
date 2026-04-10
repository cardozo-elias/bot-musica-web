import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import { Pool } from 'pg';
import { NextResponse } from 'next/server';
import spotifyUrlInfo from 'spotify-url-info';

const { getTracks, getDetails } = spotifyUrlInfo(fetch);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const DEFAULT_COVER = "https://ui-avatars.com/api/?name=🎵&background=1e1f22&color=57F287&size=512";

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    const { url } = await req.json();
    let playlistName = "Playlist Importada";
    let formattedSongs = [];

    // ==========================================
    // 🟢 SPOTIFY
    // ==========================================
    if (url.includes('spotify.com')) {
      const details = await getDetails(url);
      playlistName = details?.preview?.title || "Playlist de Spotify";

      const tracks = await getTracks(url);
      if (!tracks || tracks.length === 0) return NextResponse.json({ error: "No se encontraron canciones." }, { status: 404 });

      formattedSongs = tracks.map(track => {
        let thumb = track.album?.images?.[0]?.url || track.coverArt?.sources?.[0]?.url || track.thumbnail || 'https://i.imgur.com/Q2v1vV7.png';
        return {
          title: track.name,
          artist: track.artist || (track.artists ? track.artists[0].name : "Desconocido"),
          videoId: `spotify_${track.id}`, 
          url: track.external_urls?.spotify || url,
          thumbnail: thumb,
          requester: session.user.name,
          requesterAvatar: session.user.image
        };
      });
    } 
    // ==========================================
    // ⬛ TIDAL (Actualizado para su nuevo código)
    // ==========================================
    else if (url.includes('tidal.com')) {
      const tidalRes = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } });
      const html = await tidalRes.text();

      const titleMatch = html.match(/<title>(.*?) en TIDAL<\/title>/i) || html.match(/<meta property="og:title" content="(.*?)"/i);
      if (titleMatch && titleMatch[1]) playlistName = titleMatch[1].trim();

      // Tidal actualizó su web a Next.js, ahora la data está en __NEXT_DATA__
      const nextDataMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">(\{.*?\})<\/script>/);
      
      if (nextDataMatch && nextDataMatch[1]) {
        try {
          const tidalData = JSON.parse(nextDataMatch[1]);
          // Buscamos los tracks en la nueva estructura de Tidal
          const items = tidalData?.props?.pageProps?.initialState?.resources?.items || 
                        tidalData?.props?.pageProps?.items || [];
          
          Object.values(items).forEach(item => {
            const track = item.item || item;
            if (track && track.title) {
              formattedSongs.push({
                title: track.title,
                artist: track.artist?.name || track.artists?.[0]?.name || "Desconocido",
                videoId: `tidal_${track.id}`,
                url: track.url || url,
                thumbnail: track.album?.cover ? `https://resources.tidal.com/images/${track.album.cover.replace(/-/g, '/')}/640x640.jpg` : DEFAULT_COVER,
                requester: session.user.name,
                requesterAvatar: session.user.image
              });
            }
          });
        } catch (e) { console.error("Error parseando Tidal:", e); }
      }

      if (formattedSongs.length === 0) return NextResponse.json({ error: "No se pudieron extraer las pistas de Tidal. Asegúrate de que sea pública." }, { status: 404 });
    } else {
      return NextResponse.json({ error: "Enlace no soportado. Usa Spotify o Tidal." }, { status: 400 });
    }

    const res = await pool.query(
      'INSERT INTO user_playlists (user_id, name, songs) VALUES ($1, $2, $3) RETURNING id, name, songs', 
      [session.user.id, `${playlistName} (Importada)`, JSON.stringify(formattedSongs)]
    );
    return NextResponse.json(res.rows[0]);

  } catch (error) { 
    return NextResponse.json({ error: "Error interno al procesar el enlace." }, { status: 500 }); 
  }
}