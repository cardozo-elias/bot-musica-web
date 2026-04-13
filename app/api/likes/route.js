import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import { Pool } from 'pg';
import { NextResponse } from "next/server";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});


export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    const { videoId, title, artist } = await request.json();

    
    const check = await pool.query(
      'SELECT 1 FROM likes WHERE user_id = $1 AND video_id = $2', 
      [session.user.id, videoId]
    );

    if (check.rowCount > 0) {
      return NextResponse.json({ message: "Ya está en favoritos", alreadyExists: true });
    }

    
    await pool.query(
      'INSERT INTO likes (user_id, video_id, title, artist) VALUES ($1, $2, $3, $4)',
      [session.user.id, videoId, title, artist]
    );

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[API LIKES POST ERROR]:", e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}


export async function DELETE(request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    const { videoId } = await request.json();

    await pool.query(
      'DELETE FROM likes WHERE user_id = $1 AND video_id = $2', 
      [session.user.id, videoId]
    );

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[API LIKES DELETE ERROR]:", e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}