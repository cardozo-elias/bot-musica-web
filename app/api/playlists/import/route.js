import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import { Pool } from 'pg';
import { NextResponse } from 'next/server';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const DEFAULT_COVER = "https://ui-avatars.com/api/?name=🎵&background=1e1f22&color=a855f7&size=512";


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

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    const { url } = await req.json();
    let playlistName = "Playlist Importada";
    let formattedSongs = [];

    
    
    
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
    
    
    
    else if (url.includes('tidal.com')) {
      const isPlaylist = url.includes('/playlist/');
      const isAlbum = url.includes('/album/');
      if (!isPlaylist && !isAlbum) return NextResponse.json({ error: "Solo se soportan Playlists o Álbumes." }, { status: 400 });

      const idMatch = url.match(/(?:playlist|album)\/([a-zA-Z0-9-]+)/);
      const tidalId = idMatch ? idMatch[1] : null;
      if (!tidalId) return NextResponse.json({ error: "Enlace de Tidal inválido." }, { status: 400 });

      const type = isPlaylist ? 'playlists' : 'albums';
      let tracks = [];
      let apiSuccess = false;

      
      const publicTokens = ['gsFXkJqGrUNoYMQPZe4k3WKwijnrp8iGSwn3bApe', '4zx46pyr9o8qZNRw', '_DSTon1kC8pABnTw'];
      
      for (const token of publicTokens) {
        try {
          const headers = { 'x-tidal-token': token };
          const infoRes = await fetch(`https://api.tidal.com/v1/${type}/${tidalId}?countryCode=US`, { headers });
          
          if (infoRes.ok) {
            const infoData = await infoRes.json();
            playlistName = infoData.title || "Playlist de Tidal";

            const itemsRes = await fetch(`https://api.tidal.com/v1/${type}/${tidalId}/items?limit=150&countryCode=US`, { headers });
            const itemsData = await itemsRes.json();
            
            if (itemsData.items) {
              tracks = itemsData.items.map(item => item.item || item);
              apiSuccess = true;
              break; 
            }
          }
        } catch (e) {
          console.error("Token fail:", e);
        }
      }

      
      if (!apiSuccess) {
        const resHtml = await fetch(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
        });
        
        if (!resHtml.ok) return NextResponse.json({ error: "No se pudo acceder a Tidal." }, { status: 404 });
        const html = await resHtml.text();

        const titleMatch = html.match(/<meta property="og:title" content="([^"]+)"/);
        if (titleMatch) playlistName = titleMatch[1].replace(' on TIDAL', '');

        const jsonLdMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
        if (jsonLdMatch) {
          try {
            const data = JSON.parse(jsonLdMatch[1]);
            if (data.track && Array.isArray(data.track)) {
              tracks = data.track.map(t => ({
                title: t.name,
                artist: { name: t.byArtist?.name || t.byArtist?.[0]?.name || "Desconocido" },
                id: t.url ? t.url.split('/').pop() : Math.random().toString(),
                url: t.url,
                album: { cover: t.image?.split('images/')[1]?.replace('/640x640.jpg', '').replace(/\//g, '-') }
              }));
              apiSuccess = true;
            }
          } catch(e) {}
        }
      }

      if (tracks.length === 0) {
        return NextResponse.json({ error: "No se encontraron canciones. Es posible que el enlace sea privado o inválido." }, { status: 404 });
      }

      
      formattedSongs = tracks.map(track => {
          let thumb = DEFAULT_COVER;
          if (track.album && track.album.cover) {
              thumb = `https://resources.tidal.com/images/${track.album.cover.replace(/-/g, '/')}/640x640.jpg`;
          }

          return {
              title: track.title || track.name,
              artist: track.artist?.name || track.artists?.[0]?.name || "Desconocido",
              videoId: `tidal_${track.id}`,
              url: track.url || track.tidalUrl || url,
              thumbnail: thumb,
              requester: session.user.name,
              requesterAvatar: session.user.image
          };
      });

    } else {
      return NextResponse.json({ error: "Enlace no soportado. Usa Spotify o Tidal." }, { status: 400 });
    }

    
    
    
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