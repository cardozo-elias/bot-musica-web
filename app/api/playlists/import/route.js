import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import { Pool } from 'pg';
import { NextResponse } from 'next/server';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const DEFAULT_COVER = "https://ui-avatars.com/api/?name=🎵&background=1e1f22&color=57F287&size=512";

// Función para obtener Token de acceso oficial de Spotify
async function getSpotifyToken() {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  
  if (!clientId || !clientSecret) return null;

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials'
  });
  const data = await res.json();
  return data.access_token;
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    const { url } = await req.json();
    let playlistName = "Playlist Importada";
    let formattedSongs = [];

    // ==========================================
    // 🟢 SPOTIFY (API OFICIAL - SIN LÍMITES Y CON PORTADAS HD)
    // ==========================================
    if (url.includes('spotify.com')) {
      const token = await getSpotifyToken();
      
      if (!token) {
        return NextResponse.json({ error: "El admin del bot necesita configurar las llaves de Spotify en el archivo .env" }, { status: 400 });
      }

      // Verificamos si es Playlist o Álbum y sacamos su ID
      const isPlaylist = url.includes('/playlist/');
      const isAlbum = url.includes('/album/');
      
      if (!isPlaylist && !isAlbum) {
         return NextResponse.json({ error: "Solo se soportan enlaces de Playlists o Álbumes." }, { status: 400 });
      }

      let endpoint = '';
      if (isPlaylist) {
         const id = url.split('/playlist/')[1].split('?')[0];
         endpoint = `https://api.spotify.com/v1/playlists/${id}`;
      } else {
         const id = url.split('/album/')[1].split('?')[0];
         endpoint = `https://api.spotify.com/v1/albums/${id}`;
      }

      // 1. Obtenemos la información general (Nombre de la playlist)
      const resInfo = await fetch(endpoint, { headers: { 'Authorization': `Bearer ${token}` } });
      if (!resInfo.ok) return NextResponse.json({ error: "No se pudo acceder a la playlist. Asegúrate de que sea pública." }, { status: 404 });
      const dataInfo = await resInfo.json();
      
      playlistName = dataInfo.name || "Playlist de Spotify";

      // 2. Extraemos TODAS las canciones (Paginación Infinita)
      let tracksUrl = isPlaylist ? dataInfo.tracks.href : `${endpoint}/tracks`;
      let allItems = [];

      while (tracksUrl) {
        const resTracks = await fetch(tracksUrl, { headers: { 'Authorization': `Bearer ${token}` } });
        const dataTracks = await resTracks.json();
        allItems = allItems.concat(dataTracks.items);
        tracksUrl = dataTracks.next; // Si hay más de 100, Spotify nos da el link a la siguiente página
      }

      // 3. Formateamos las canciones
      formattedSongs = allItems.map(item => {
        // En playlists la canción está dentro de "item.track". En álbumes es "item" directo.
        const track = isPlaylist ? item.track : item;
        if (!track) return null;

        // Buscamos la portada exacta
        let thumb = DEFAULT_COVER;
        if (isPlaylist && track.album?.images?.length > 0) {
          thumb = track.album.images[0].url; // Portada HD de la canción
        } else if (isAlbum && dataInfo.images?.length > 0) {
          thumb = dataInfo.images[0].url; // Portada HD del álbum padre
        }

        return {
          title: track.name,
          artist: track.artists?.[0]?.name || "Desconocido",
          videoId: `spotify_${track.id}`, 
          url: track.external_urls?.spotify || url,
          thumbnail: thumb,
          requester: session.user.name,
          requesterAvatar: session.user.image
        };
      }).filter(Boolean);

    } 
    // ==========================================
    // ⬛ TIDAL (Scraper Nativo)
    // ==========================================
    else if (url.includes('tidal.com')) {
      const tidalRes = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } });
      const html = await tidalRes.text();

      const titleMatch = html.match(/<title>(.*?) en TIDAL<\/title>/i) || html.match(/<meta property="og:title" content="(.*?)"/i);
      if (titleMatch && titleMatch[1]) playlistName = titleMatch[1].trim();

      const nextDataMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">(\{.*?\})<\/script>/);
      
      if (nextDataMatch && nextDataMatch[1]) {
        try {
          const tidalData = JSON.parse(nextDataMatch[1]);
          const items = tidalData?.props?.pageProps?.initialState?.resources?.items || tidalData?.props?.pageProps?.items || [];
          
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

      if (formattedSongs.length === 0) return NextResponse.json({ error: "No se pudieron extraer las pistas de Tidal." }, { status: 404 });
    } else {
      return NextResponse.json({ error: "Enlace no soportado. Usa Spotify o Tidal." }, { status: 400 });
    }

    // ==========================================
    // 💾 GUARDADO EN BASE DE DATOS
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