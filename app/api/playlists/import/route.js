import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import { Pool } from 'pg';
import { NextResponse } from 'next/server';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const DEFAULT_COVER = "https://ui-avatars.com/api/?name=🎵&background=1e1f22&color=57F287&size=512";

// 🟢 OBTENER TOKEN DE SPOTIFY
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

// ⬛ OBTENER TOKEN DE TIDAL
async function getTidalToken() {
  const clientId = process.env.TIDAL_CLIENT_ID;
  const clientSecret = process.env.TIDAL_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const res = await fetch('https://auth.tidal.com/v1/oauth2/token', {
    method: 'POST',
    headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
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
    // 🟢 MOTOR 1: SPOTIFY API OFICIAL
    // ==========================================
    if (url.includes('spotify.com')) {
      const token = await getSpotifyToken();
      if (!token) return NextResponse.json({ error: "Faltan las credenciales de Spotify en el archivo .env" }, { status: 400 });

      const isPlaylist = url.includes('/playlist/');
      const isAlbum = url.includes('/album/');
      if (!isPlaylist && !isAlbum) return NextResponse.json({ error: "Solo se soportan Playlists o Álbumes." }, { status: 400 });

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
    // ⬛ MOTOR 2: TIDAL API OFICIAL
    // ==========================================
    else if (url.includes('tidal.com')) {
      const token = await getTidalToken();
      if (!token) return NextResponse.json({ error: "Faltan las credenciales de Tidal en el archivo .env" }, { status: 400 });

      const isPlaylist = url.includes('/playlist/');
      const isAlbum = url.includes('/album/');
      if (!isPlaylist && !isAlbum) return NextResponse.json({ error: "Solo se soportan Playlists o Álbumes." }, { status: 400 });

      // Extraemos el UUID del enlace
      const idMatch = url.match(/(?:playlist|album)\/([a-zA-Z0-9-]+)/);
      const tidalId = idMatch ? idMatch[1] : null;
      
      if (!tidalId) return NextResponse.json({ error: "Enlace de Tidal inválido." }, { status: 400 });

      const headers = { 
        'Authorization': `Bearer ${token}`, 
        'Accept': 'application/vnd.tidal.v1+json' 
      };

      // 1. Buscamos el Nombre de la Playlist/Álbum
      const type = isPlaylist ? 'playlists' : 'albums';
      const resInfo = await fetch(`https://openapi.tidal.com/${type}/${tidalId}`, { headers });
      if (!resInfo.ok) return NextResponse.json({ error: "No se pudo acceder a Tidal. Verifica el enlace." }, { status: 404 });
      
      const infoData = await resInfo.json();
      playlistName = infoData.resource?.title || infoData.title || "Playlist de Tidal";

      // 2. Traemos las canciones
      const resItems = await fetch(`https://openapi.tidal.com/${type}/${tidalId}/items?limit=150`, { headers });
      const itemsData = await resItems.json();
      const items = itemsData.data || itemsData.items || [];

      formattedSongs = items.map(item => {
        const track = item.resource || item.item || item;
        if (!track || !track.title) return null;

        // Construimos la URL de la imagen en alta calidad
        let thumb = DEFAULT_COVER;
        if (track.album?.cover) {
           thumb = `https://resources.tidal.com/images/${track.album.cover.replace(/-/g, '/')}/640x640.jpg`;
        }

        return {
          title: track.title,
          artist: track.artist?.name || track.artists?.[0]?.name || "Desconocido",
          videoId: `tidal_${track.id}`,
          url: track.tidalUrl || track.url || url,
          thumbnail: thumb,
          requester: session.user.name,
          requesterAvatar: session.user.image
        };
      }).filter(Boolean);

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