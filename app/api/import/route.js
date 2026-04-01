import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { getUserFromCookies } from '@/lib/auth'

export async function POST(request) {
  try {
    const payload = await getUserFromCookies()
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    
    const { data } = await request.json()
    
    if (!data || !data.series) {
      return NextResponse.json({ error: 'Invalid import data' }, { status: 400 })
    }
    
    const db = getDb()
    let imported = 0
    
    for (const s of data.series) {
      // Insert series
      const result = db.prepare(`
        INSERT INTO series (user_id, title, image_url, created_at) VALUES (?, ?, ?, ?)
      `).run(payload.userId, s.title, s.image_url || null, s.created_at || new Date().toISOString())
      
      const seriesId = result.lastInsertRowid
      
      for (const se of (s.seasons || [])) {
        const seasonResult = db.prepare(`
          INSERT INTO seasons (series_id, number, title) VALUES (?, ?, ?)
        `).run(seriesId, se.number, se.title || null)
        
        const seasonId = seasonResult.lastInsertRowid
        
        for (const ch of (se.chapters || [])) {
          db.prepare(`
            INSERT INTO chapters (season_id, number, title, seen, rating, seen_date, comments) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `).run(seasonId, ch.number, ch.title || null, ch.seen ? 1 : 0, ch.rating || null, ch.seen_date || null, ch.comments || null)
        }
      }
      imported++
    }
    
    return NextResponse.json({ success: true, imported })
  } catch (error) {
    console.error('Import error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
