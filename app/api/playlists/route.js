import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import { Pool } from 'pg';
import { NextResponse } from 'next/server';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});


pool.query(`ALTER TABLE user_playlists ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;`).catch(() => {});


export async function GET(req) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    try {
        const res = await pool.query(
            'SELECT id, name, songs, is_public FROM user_playlists WHERE user_id = $1 ORDER BY id DESC', 
            [session.user.id]
        );
        return NextResponse.json(res.rows);
    } catch (e) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}


export async function POST(req) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    
    try {
        const { name, song } = await req.json();
        let initialSongs = [];
        if (song) {
            initialSongs.push({
                title: song.title,
                artist: song.artist || song.author || "Desconocido",
                url: song.url || `https://www.youtube.com/watch?v=${song.videoId}`,
                videoId: song.videoId,
                thumbnail: song.thumbnail,
                requester: session.user.name,
                requesterAvatar: session.user.image
            });
        }

        const res = await pool.query(
            'INSERT INTO user_playlists (user_id, name, songs, is_public) VALUES ($1, $2, $3, false) RETURNING id, name, songs, is_public', 
            [session.user.id, name, JSON.stringify(initialSongs)]
        );
        return NextResponse.json(res.rows[0]);
    } catch (e) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}


export async function DELETE(req) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        await pool.query('DELETE FROM user_playlists WHERE id = $1 AND user_id = $2', [id, session.user.id]);
        return NextResponse.json({ success: true });
    } catch (e) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}


export async function PUT(req) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    try {
        const { playlistId, song } = await req.json();
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
    } catch (e) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}


export async function PATCH(req) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    
    try {
        const { playlistId, videoId, action, newSongs, newName, isPublic } = await req.json();
        
        
        if (action === 'visibility' && isPublic !== undefined) {
            await pool.query(`UPDATE user_playlists SET is_public = $1 WHERE id = $2 AND user_id = $3`, [isPublic, playlistId, session.user.id]);
            return NextResponse.json({ success: true });
        }

        
        if (action === 'rename' && newName) {
            await pool.query(`UPDATE user_playlists SET name = $1 WHERE id = $2 AND user_id = $3`, [newName, playlistId, session.user.id]);
            return NextResponse.json({ success: true });
        }

        
        if (action === 'reorder' && newSongs) {
            await pool.query(`UPDATE user_playlists SET songs = $1 WHERE id = $2 AND user_id = $3`, [JSON.stringify(newSongs), playlistId, session.user.id]);
            return NextResponse.json({ success: true });
        }

        
        const res = await pool.query('SELECT songs FROM user_playlists WHERE id = $1 AND user_id = $2', [playlistId, session.user.id]);
        if (res.rows.length === 0) return NextResponse.json({ error: "No encontrada" });
        const updatedSongs = res.rows[0].songs.filter(s => s.videoId !== videoId);
        await pool.query(`UPDATE user_playlists SET songs = $1 WHERE id = $2 AND user_id = $3`, [JSON.stringify(updatedSongs), playlistId, session.user.id]);
        
        return NextResponse.json({ success: true });
    } catch(e) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}