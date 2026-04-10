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

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    const { url } = await req.json();
    let playlistName = "Playlist Importada";
    let formattedSongs = [];

    // ==========================================
    // 🟢 MOTOR 1: IMPORTADOR DE SPOTIFY
    // ==========================================
    if (url.includes('spotify.com')) {
      const details = await getDetails(url);
      playlistName = details?.preview?.title || "Playlist de Spotify";

      const tracks = await getTracks(url);
      if (!tracks || tracks.length === 0) return NextResponse.json({ error: "No se encontraron canciones." }, { status: 404 });

      formattedSongs = tracks.map(track => ({
        title: track.name,
        artist: track.artist || (track.artists ? track.artists[0].name : "Desconocido"),
        videoId: `spotify_${track.id}`, 
        url: track.external_urls?.spotify || "",
        thumbnail: track.coverArt?.sources?.[0]?.url || 'https://i.imgur.com/Q2v1vV7.png',
        requester: session.user.name,
        requesterAvatar: session.user.image
      }));
    } 
    
    // ==========================================
    // ⬛ MOTOR 2: SCRAPER DE TIDAL (Nativo)
    // ==========================================
    else if (url.includes('tidal.com')) {
      // Hacemos una petición invisible a la web de Tidal
      const tidalRes = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
      });
      const html = await tidalRes.text();

      // Extraemos el nombre de la playlist buscando la etiqueta <title>
      const titleMatch = html.match(/<title>(.*?) en TIDAL<\/title>/i) || html.match(/<meta property="og:title" content="(.*?)"/i);
      if (titleMatch && titleMatch[1]) playlistName = titleMatch[1].trim();

      // Tidal guarda la lista de canciones en un bloque JSON escondido en el HTML. Lo extraemos con Regex.
      const scriptMatch = html.match(/window\.__INITIAL_STATE__\s*=\s*(\{.*?\});/);
      
      if (scriptMatch && scriptMatch[1]) {
        try {
          const tidalData = JSON.parse(scriptMatch[1]);
          // Navegamos por el laberinto de datos de Tidal para encontrar los tracks
          const trackList = tidalData?.resources?.items || []; 
          
          formattedSongs = trackList.map(item => {
            const track = item.item || item;
            return {
              title: track.title,
              artist: track.artist?.name || track.artists?.[0]?.name || "Desconocido",
              videoId: `tidal_${track.id}`,
              url: track.url || url,
              // Tidal guarda las portadas con un formato de resoluciones, armamos la URL:
              thumbnail: track.album?.cover ? `https://resources.tidal.com/images/${track.album.cover.replace(/-/g, '/')}/640x640.jpg` : 'https://i.imgur.com/Q2v1vV7.png',
              requester: session.user.name,
              requesterAvatar: session.user.image
            };
          }).filter(s => s.title); // Filtramos por si hay items corruptos
        } catch (e) {
          console.error("Error parseando JSON de Tidal:", e);
        }
      }

      if (formattedSongs.length === 0) {
        return NextResponse.json({ error: "No se pudieron extraer las pistas de este enlace de Tidal. Asegúrate de que sea una Playlist pública." }, { status: 404 });
      }
    } 
    
    // Si no es ni Spotify ni Tidal...
    else {
      return NextResponse.json({ error: "Enlace no soportado. Usa Spotify o Tidal." }, { status: 400 });
    }

    // ==========================================
    // 💾 GUARDADO EN BASE DE DATOS (Universal)
    // ==========================================
    const res = await pool.query(
      'INSERT INTO user_playlists (user_id, name, songs) VALUES ($1, $2, $3) RETURNING id, name, songs', 
      [session.user.id, `${playlistName} (Importada)`, JSON.stringify(formattedSongs)]
    );
    
    return NextResponse.json(res.rows[0]);

  } catch (error) { 
    console.error("[IMPORT ERROR]:", error);
    return NextResponse.json({ error: "Error interno al procesar el enlace." }, { status: 500 }); 
  }
}