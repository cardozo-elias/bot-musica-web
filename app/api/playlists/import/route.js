import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import { Pool } from 'pg';
import { NextResponse } from 'next/server';
import spotifyUrlInfo from 'spotify-url-info';

// Usamos el fetch nativo de Next.js para el scraper de Spotify
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

    if (!url.includes('spotify.com/playlist') && !url.includes('spotify.com/album')) {
      return NextResponse.json({ error: "Por favor, ingresa un enlace válido de una Playlist o Álbum de Spotify." }, { status: 400 });
    }

    // 1. Obtenemos el nombre de la Playlist original de Spotify
    const details = await getDetails(url);
    const playlistName = details?.preview?.title || "Playlist Importada";

    // 2. Extraemos todas las pistas
    const tracks = await getTracks(url);
    if (!tracks || tracks.length === 0) {
      return NextResponse.json({ error: "No se encontraron canciones en este enlace." }, { status: 404 });
    }

    // 3. Mapeamos las canciones al formato de Musicardi (Le ponemos ID de iTunes falso para que el bot las busque en HD)
    const formattedSongs = tracks.map(track => {
      const artistName = track.artist || (track.artists ? track.artists[0].name : "Desconocido");
      return {
        title: track.name,
        artist: artistName,
        // Usamos el ID de Spotify temporalmente. Cuando el bot lo lea, no lo encontrará en YT y usará el texto para buscar el audio real.
        videoId: `spotify_${track.id}`, 
        url: track.external_urls?.spotify || "",
        thumbnail: track.coverArt?.sources?.[0]?.url || 'https://i.imgur.com/Q2v1vV7.png',
        requester: session.user.name,
        requesterAvatar: session.user.image
      };
    });

    // 4. Guardamos todo el bloque en PostgreSQL
    const res = await pool.query(
      'INSERT INTO user_playlists (user_id, name, songs) VALUES ($1, $2, $3) RETURNING id, name, songs', 
      [session.user.id, `${playlistName} (Importada)`, JSON.stringify(formattedSongs)]
    );
    
    return NextResponse.json(res.rows[0]);

  } catch (error) { 
    console.error("[SPOTIFY IMPORT ERROR]:", error);
    return NextResponse.json({ error: "Error al importar desde Spotify. Asegúrate de que la playlist sea pública." }, { status: 500 }); 
  }
}