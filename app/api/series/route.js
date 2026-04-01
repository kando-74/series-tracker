import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { getUserFromCookies } from '@/lib/auth'

export async function GET() {
  try {
    const payload = await getUserFromCookies()
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    
    const db = getDb()
    const series = db.prepare(`
      SELECT s.*,
        (SELECT COUNT(*) FROM seasons WHERE series_id = s.id) as season_count,
        (SELECT COUNT(*) FROM chapters c JOIN seasons se ON c.season_id = se.id WHERE se.series_id = s.id) as chapter_count,
        (SELECT COUNT(*) FROM chapters c JOIN seasons se ON c.season_id = se.id WHERE se.series_id = s.id AND c.seen = 1) as seen_count,
        (SELECT AVG(c.rating) FROM chapters c JOIN seasons se ON c.season_id = se.id WHERE se.series_id = s.id AND c.seen = 1 AND c.rating IS NOT NULL) as avg_rating
      FROM series s
      WHERE s.user_id = ?
      ORDER BY s.created_at DESC
    `).all(payload.userId)
    
    return NextResponse.json({ series })
  } catch (error) {
    console.error('Get series error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const payload = await getUserFromCookies()
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    
    const { title, image_url } = await request.json()
    if (!title) return NextResponse.json({ error: 'Title required' }, { status: 400 })
    
    const db = getDb()
    const result = db.prepare('INSERT INTO series (user_id, title, image_url) VALUES (?, ?, ?)').run(
      payload.userId, title, image_url || null
    )
    
    return NextResponse.json({ 
      series: { id: result.lastInsertRowid, title, image_url, user_id: payload.userId } 
    })
  } catch (error) {
    console.error('Create series error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function PUT(request) {
  try {
    const payload = await getUserFromCookies()
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    
    const { id, title, image_url } = await request.json()
    if (!id || !title) return NextResponse.json({ error: 'ID and title required' }, { status: 400 })
    
    const db = getDb()
    db.prepare('UPDATE series SET title = ?, image_url = ? WHERE id = ? AND user_id = ?').run(
      title, image_url || null, id, payload.userId
    )
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Update series error:', error)
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
    db.prepare('DELETE FROM series WHERE id = ? AND user_id = ?').run(id, payload.userId)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete series error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
