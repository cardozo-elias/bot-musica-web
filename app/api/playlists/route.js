import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import { Pool } from 'pg';
import { NextResponse } from 'next/server';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Obtener todas las playlists del usuario
export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  try {
    const res = await pool.query(
      'SELECT id, name, songs FROM user_playlists WHERE user_id = $1 ORDER BY id DESC', 
      [session.user.id]
    );
    return NextResponse.json(res.rows);
  } catch (e) { 
    return NextResponse.json({ error: e.message }, { status: 500 }); 
  }
}

// Crear una nueva playlist
export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  try {
    const { name } = await req.json();
    await pool.query(
      'INSERT INTO user_playlists (user_id, name, songs) VALUES ($1, $2, $3)', 
      [session.user.id, name, '[]']
    );
    return NextResponse.json({ success: true });
  } catch (e) { 
    return NextResponse.json({ error: e.message }, { status: 500 }); 
  }
}

// Eliminar una playlist
export async function DELETE(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    await pool.query(
      'DELETE FROM user_playlists WHERE id = $1 AND user_id = $2', 
      [id, session.user.id]
    );
    return NextResponse.json({ success: true });
  } catch (e) { 
    return NextResponse.json({ error: e.message }, { status: 500 }); 
  }
}

// Añadir una canción a una playlist (Append al JSONB)
export async function PUT(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  try {
    const { playlistId, song } = await req.json();
    
    // Limpiamos el objeto song para que coincida con el formato del bot
    const cleanSong = {
      title: song.title,
      artist: song.artist || song.author || "Desconocido",
      url: song.url,
      videoId: song.videoId,
      thumbnail: song.thumbnail,
      requester: session.user.name,
      requesterAvatar: session.user.image
    };

    await pool.query(
      `UPDATE user_playlists SET songs = songs || $1::jsonb WHERE id = $2 AND user_id = $3`,
      [JSON.stringify([cleanSong]), playlistId, session.user.id]
    );
    return NextResponse.json({ success: true });
  } catch (e) { 
    return NextResponse.json({ error: e.message }, { status: 500 }); 
  }
}
// Añade este método al final de tu app/api/playlists/route.js
export async function PATCH(req) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    try {
        const { playlistId, videoId } = await req.json();
        
        // Obtenemos la playlist actual
        const res = await pool.query('SELECT songs FROM user_playlists WHERE id = $1 AND user_id = $2', [playlistId, session.user.id]);
        if (res.rows.length === 0) return NextResponse.json({ error: "No encontrada" });

        // Filtramos para quitar la canción por su videoId
        const updatedSongs = res.rows[0].songs.filter(s => s.videoId !== videoId);

        await pool.query(
            `UPDATE user_playlists SET songs = $1 WHERE id = $2 AND user_id = $3`,
            [JSON.stringify(updatedSongs), playlistId, session.user.id]
        );
        return NextResponse.json({ success: true });
    } catch(e) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}