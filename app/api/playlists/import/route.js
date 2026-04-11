import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import { Pool } from 'pg';
import { NextResponse } from 'next/server';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const DEFAULT_COVER = "https://ui-avatars.com/api/?name=🎵&background=1e1f22&color=a855f7&size=512";

// 🟢 OBTENER TOKEN DE SPOTIFY (URLs Corregidas)
async function getSpotifyToken() {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials'
  });
  const data = await res.json();
  return data.access_token;
}

// ⬛ TIDAL YA NO NECESITA TOKEN, USAREMOS WEB SCRAPING

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    const { url } = await req.json();
    let playlistName = "Playlist Importada";
    let formattedSongs = [];

    // ==========================================
    // 🟢 MOTOR 1: SPOTIFY API OFICIAL
    // ==========================================
    if (url.includes('spotify.com')) {
      const token = await getSpotifyToken();
      if (!token) return NextResponse.json({ error: "Faltan las credenciales de Spotify en el archivo .env" }, { status: 400 });

      const isPlaylist = url.includes('/playlist/');
      const isAlbum = url.includes('/album/');
      if (!isPlaylist && !isAlbum) return NextResponse.json({ error: "Solo se soportan Playlists o Álbumes." }, { status: 400 });

      // URLs de la API restauradas a las originales
      let endpoint = isPlaylist 
        ? `https://api.spotify.com/v1/playlists/${url.split('/playlist/')[1].split('?')[0]}`
        : `https://api.spotify.com/v1/albums/${url.split('/album/')[1].split('?')[0]}`;

      const resInfo = await fetch(endpoint, { headers: { 'Authorization': `Bearer ${token}` } });
      if (!resInfo.ok) return NextResponse.json({ error: "No se pudo acceder a la playlist de Spotify." }, { status: 404 });
      const dataInfo = await resInfo.json();
      
      playlistName = dataInfo.name || "Playlist de Spotify";

      let tracksUrl = isPlaylist ? dataInfo.tracks.href : `${endpoint}/tracks`;
      let allItems = [];

      // Paginación para traer más de 100
      while (tracksUrl) {
        const resTracks = await fetch(tracksUrl, { headers: { 'Authorization': `Bearer ${token}` } });
        const dataTracks = await resTracks.json();
        allItems = allItems.concat(dataTracks.items);
        tracksUrl = dataTracks.next; 
      }

      formattedSongs = allItems.map(item => {
        const track = isPlaylist ? item.track : item;
        if (!track) return null;

        let thumb = DEFAULT_COVER;
        if (isPlaylist && track.album?.images?.length > 0) thumb = track.album.images[0].url;
        else if (isAlbum && dataInfo.images?.length > 0) thumb = dataInfo.images[0].url;

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
    // ⬛ MOTOR 2: TIDAL (SCRAPER SIMULANDO NAVEGADOR)
    // ==========================================
    else if (url.includes('tidal.com')) {
      const isPlaylist = url.includes('/playlist/');
      const isAlbum = url.includes('/album/');
      if (!isPlaylist && !isAlbum) return NextResponse.json({ error: "Solo se soportan Playlists o Álbumes." }, { status: 400 });

      // Simulamos ser Chrome en Windows para evitar el bloqueo 403 de Tidal
      const resHtml = await fetch(url, {
          headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
              'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache'
          }
      });

      if (!resHtml.ok) return NextResponse.json({ error: "No se pudo acceder a Tidal. Verifica el enlace o la privacidad de la playlist." }, { status: 404 });
      
      const html = await resHtml.text();

      // 1. Extraemos el título leyendo los metadatos de la página
      const titleMatch = html.match(/<meta property="og:title" content="([^"]+)"/);
      playlistName = titleMatch ? titleMatch[1].replace(' on TIDAL', '') : "Playlist de Tidal";

      // 2. Extraemos el JSON gigante que Tidal inyecta en el código fuente de sus páginas
      const jsonMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/);
      if (!jsonMatch) return NextResponse.json({ error: "No se encontraron canciones. Es posible que el enlace sea privado o inválido." }, { status: 500 });

      const tidalData = JSON.parse(jsonMatch[1]);
      let tracks = [];

      // Buscador recursivo: Recorre todo el JSON buscando objetos que parezcan canciones
      const extractTracks = (obj) => {
          if (!obj) return;
          if (Array.isArray(obj)) {
              obj.forEach(extractTracks);
          } else if (typeof obj === 'object') {
              if (obj.type === 'track' && obj.title && obj.artists) {
                  tracks.push(obj);
              } else if (obj.items && Array.isArray(obj.items)) {
                  obj.items.forEach(item => extractTracks(item.item || item));
              } else {
                  Object.values(obj).forEach(extractTracks);
              }
          }
      };

      extractTracks(tidalData);

      // Limpiamos canciones duplicadas (a veces el JSON de Tidal lista la misma canción dos veces)
      const uniqueTracks = Array.from(new Map(tracks.map(t => [t.id, t])).values());

      formattedSongs = uniqueTracks.map(track => {
          let thumb = DEFAULT_COVER;
          // Construimos el enlace de la imagen original en alta calidad
          if (track.album && track.album.cover) {
              thumb = `https://resources.tidal.com/images/${track.album.cover.replace(/-/g, '/')}/640x640.jpg`;
          }

          return {
              title: track.title,
              artist: track.artists?.[0]?.name || "Desconocido",
              videoId: `tidal_${track.id}`,
              url: track.url || url,
              thumbnail: thumb,
              requester: session.user.name,
              requesterAvatar: session.user.image
          };
      });

      if (formattedSongs.length === 0) {
           return NextResponse.json({ error: "La playlist está vacía o es totalmente privada." }, { status: 404 });
      }
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