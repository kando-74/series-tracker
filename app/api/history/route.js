import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { getUserFromCookies } from '@/lib/auth'

export async function GET(request) {
  try {
    const payload = await getUserFromCookies()
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    
    const db = getDb()
    
    const history = db.prepare(`
      SELECT 
        c.id,
        c.number as chapter_number,
        c.title as chapter_title,
        c.seen_date,
        c.rating,
        c.comments,
        se.number as season_number,
        s.title as series_title
      FROM chapters c
      JOIN seasons se ON c.season_id = se.id
      JOIN series s ON se.series_id = s.id
      WHERE s.user_id = ? AND c.seen = 1
      ORDER BY c.seen_date DESC, c.updated_at DESC
    `).all(payload.userId)
    
    return NextResponse.json({ history })
  } catch (error) {
    console.error('History error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
