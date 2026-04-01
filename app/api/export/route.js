import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { getUserFromCookies } from '@/lib/auth'

export async function GET(request) {
  try {
    const payload = await getUserFromCookies()
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    
    const db = getDb()
    
    const series = db.prepare(`
      SELECT id, title, image_url, created_at FROM series WHERE user_id = ?
    `).all(payload.userId)
    
    const data = { exported_at: new Date().toISOString(), version: '1.0', series: [] }
    
    for (const s of series) {
      const seasons = db.prepare(`
        SELECT id, number, title FROM seasons WHERE series_id = ?
      `).all(s.id)
      
      for (const se of seasons) {
        se.chapters = db.prepare(`
          SELECT number, title, seen, rating, seen_date, comments FROM chapters WHERE season_id = ?
        `).all(se.id)
      }
      
      data.series.push({ ...s, seasons })
    }
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
