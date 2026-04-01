import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { getUserFromCookies } from '@/lib/auth'

function verifyChapterOwnership(db, chapterId, userId) {
  return db.prepare(`
    SELECT c.id FROM chapters c
    JOIN seasons se ON c.season_id = se.id
    JOIN series s ON se.series_id = s.id
    WHERE c.id = ? AND s.user_id = ?
  `).get(chapterId, userId)
}

export async function GET(request) {
  try {
    const payload = await getUserFromCookies()
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    
    const { searchParams } = new URL(request.url)
    const seasonId = searchParams.get('season_id')
    if (!seasonId) return NextResponse.json({ error: 'season_id required' }, { status: 400 })
    
    const db = getDb()
    
    // Verify season belongs to user
    const season = db.prepare(`
      SELECT se.id FROM seasons se
      JOIN series s ON se.series_id = s.id
      WHERE se.id = ? AND s.user_id = ?
    `).get(seasonId, payload.userId)
    if (!season) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    
    const chapters = db.prepare(`
      SELECT * FROM chapters
      WHERE season_id = ?
      ORDER BY number ASC
    `).all(seasonId)
    
    return NextResponse.json({ chapters })
  } catch (error) {
    console.error('Get chapters error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const payload = await getUserFromCookies()
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    
    const { season_id, number, title } = await request.json()
    if (!season_id || number === undefined) {
      return NextResponse.json({ error: 'season_id and number required' }, { status: 400 })
    }
    
    const db = getDb()
    
    // Verify season belongs to user
    const season = db.prepare(`
      SELECT se.id FROM seasons se
      JOIN series s ON se.series_id = s.id
      WHERE se.id = ? AND s.user_id = ?
    `).get(season_id, payload.userId)
    if (!season) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    
    const result = db.prepare('INSERT INTO chapters (season_id, number, title) VALUES (?, ?, ?)').run(
      season_id, number, title || null
    )
    
    return NextResponse.json({ 
      chapter: { id: result.lastInsertRowid, season_id, number, title, seen: 0 } 
    })
  } catch (error) {
    console.error('Create chapter error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function PUT(request) {
  try {
    const payload = await getUserFromCookies()
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    
    const { id, number, title, seen, rating, seen_date, comments } = await request.json()
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })
    
    const db = getDb()
    const chapter = verifyChapterOwnership(db, id, payload.userId)
    if (!chapter) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    
    const updates = []
    const values = []
    
    if (number !== undefined) { updates.push('number = ?'); values.push(number) }
    if (title !== undefined) { updates.push('title = ?'); values.push(title) }
    if (seen !== undefined) { updates.push('seen = ?'); values.push(seen ? 1 : 0) }
    if (rating !== undefined) { updates.push('rating = ?'); values.push(rating || null) }
    if (seen_date !== undefined) { updates.push('seen_date = ?'); values.push(seen_date || null) }
    if (comments !== undefined) { updates.push('comments = ?'); values.push(comments || null) }
    
    if (updates.length > 0) {
      values.push(id)
      db.prepare(`UPDATE chapters SET ${updates.join(', ')} WHERE id = ?`).run(...values)
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Update chapter error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const payload = await getUserFromCookies()
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })
    
    const db = getDb()
    const chapter = verifyChapterOwnership(db, id, payload.userId)
    if (!chapter) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    
    db.prepare('DELETE FROM chapters WHERE id = ?').run(id)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete chapter error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
