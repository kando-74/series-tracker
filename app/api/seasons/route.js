import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { getUserFromCookies } from '@/lib/auth'

export async function GET(request) {
  try {
    const payload = await getUserFromCookies()
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    
    const { searchParams } = new URL(request.url)
    const seriesId = searchParams.get('series_id')
    if (!seriesId) return NextResponse.json({ error: 'series_id required' }, { status: 400 })
    
    const db = getDb()
    
    // Verify series belongs to user
    const series = db.prepare('SELECT id FROM series WHERE id = ? AND user_id = ?').get(seriesId, payload.userId)
    if (!series) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    
    const seasons = db.prepare(`
      SELECT se.*,
        (SELECT COUNT(*) FROM chapters WHERE season_id = se.id) as chapter_count,
        (SELECT COUNT(*) FROM chapters WHERE season_id = se.id AND seen = 1) as seen_count,
        (SELECT AVG(rating) FROM chapters WHERE season_id = se.id AND seen = 1 AND rating IS NOT NULL) as avg_rating
      FROM seasons se
      WHERE se.series_id = ?
      ORDER BY se.number ASC
    `).all(seriesId)
    
    return NextResponse.json({ seasons })
  } catch (error) {
    console.error('Get seasons error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const payload = await getUserFromCookies()
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    
    const { series_id, number, title } = await request.json()
    if (!series_id || number === undefined) {
      return NextResponse.json({ error: 'series_id and number required' }, { status: 400 })
    }
    
    const db = getDb()
    
    // Verify series belongs to user
    const series = db.prepare('SELECT id FROM series WHERE id = ? AND user_id = ?').get(series_id, payload.userId)
    if (!series) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    
    const result = db.prepare('INSERT INTO seasons (series_id, number, title) VALUES (?, ?, ?)').run(
      series_id, number, title || null
    )
    
    return NextResponse.json({ 
      season: { id: result.lastInsertRowid, series_id, number, title } 
    })
  } catch (error) {
    console.error('Create season error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function PUT(request) {
  try {
    const payload = await getUserFromCookies()
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    
    const { id, number, title } = await request.json()
    if (!id || number === undefined) {
      return NextResponse.json({ error: 'ID and number required' }, { status: 400 })
    }
    
    const db = getDb()
    
    // Verify season belongs to user
    const season = db.prepare(`
      SELECT se.id FROM seasons se
      JOIN series s ON se.series_id = s.id
      WHERE se.id = ? AND s.user_id = ?
    `).get(id, payload.userId)
    if (!season) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    
    db.prepare('UPDATE seasons SET number = ?, title = ? WHERE id = ?').run(
      number, title || null, id
    )
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Update season error:', error)
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
    
    // Verify season belongs to user
    const season = db.prepare(`
      SELECT se.id FROM seasons se
      JOIN series s ON se.series_id = s.id
      WHERE se.id = ? AND s.user_id = ?
    `).get(id, payload.userId)
    if (!season) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    
    db.prepare('DELETE FROM seasons WHERE id = ?').run(id)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete season error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
