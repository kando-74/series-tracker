import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { getUserFromCookies } from '@/lib/auth'

export async function GET(request) {
  try {
    const payload = await getUserFromCookies()
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    
    const { searchParams } = new URL(request.url)
    const level = searchParams.get('level') // 'global', 'series', 'season'
    const id = searchParams.get('id')
    
    const db = getDb()
    
    if (level === 'series' && id) {
      // Stats for a specific series
      const stats = db.prepare(`
        SELECT 
          s.id, s.title,
          (SELECT COUNT(*) FROM seasons WHERE series_id = s.id) as total_seasons,
          (SELECT COUNT(*) FROM chapters c JOIN seasons se ON c.season_id = se.id WHERE se.series_id = s.id) as total_chapters,
          (SELECT COUNT(*) FROM chapters c JOIN seasons se ON c.season_id = se.id WHERE se.series_id = s.id AND c.seen = 1) as seen_chapters,
          (SELECT AVG(c.rating) FROM chapters c JOIN seasons se ON c.season_id = se.id WHERE se.series_id = s.id AND c.seen = 1 AND c.rating IS NOT NULL) as avg_rating,
          (SELECT MAX(c.seen_date) FROM chapters c JOIN seasons se ON c.season_id = se.id WHERE se.series_id = s.id AND c.seen = 1) as last_seen
        FROM series s
        WHERE s.id = ? AND s.user_id = ?
      `).get(id, payload.userId)
      
      return NextResponse.json({ stats })
    }
    
    if (level === 'season' && id) {
      // Stats for a specific season
      const stats = db.prepare(`
        SELECT 
          se.id, se.number, se.title, s.title as series_title,
          (SELECT COUNT(*) FROM chapters WHERE season_id = se.id) as total_chapters,
          (SELECT COUNT(*) FROM chapters WHERE season_id = se.id AND seen = 1) as seen_chapters,
          (SELECT AVG(rating) FROM chapters WHERE season_id = se.id AND seen = 1 AND rating IS NOT NULL) as avg_rating,
          (SELECT MAX(seen_date) FROM chapters WHERE season_id = se.id AND seen = 1) as last_seen
        FROM seasons se
        JOIN series s ON se.series_id = s.id
        WHERE se.id = ? AND s.user_id = ?
      `).get(id, payload.userId)
      
      return NextResponse.json({ stats })
    }
    
    // Global stats
    const global = db.prepare(`
      SELECT 
        (SELECT COUNT(*) FROM series WHERE user_id = ?) as total_series,
        (SELECT COUNT(*) FROM seasons se JOIN series s ON se.series_id = s.id WHERE s.user_id = ?) as total_seasons,
        (SELECT COUNT(*) FROM chapters c JOIN seasons se ON c.season_id = se.id JOIN series s ON se.series_id = s.id WHERE s.user_id = ?) as total_chapters,
        (SELECT COUNT(*) FROM chapters c JOIN seasons se ON c.season_id = se.id JOIN series s ON se.series_id = s.id WHERE s.user_id = ? AND c.seen = 1) as seen_chapters,
        (SELECT AVG(c.rating) FROM chapters c JOIN seasons se ON c.season_id = se.id JOIN series s ON se.series_id = s.id WHERE s.user_id = ? AND c.seen = 1 AND c.rating IS NOT NULL) as global_avg_rating
    `).get(payload.userId, payload.userId, payload.userId, payload.userId, payload.userId)
    
    // Per-series breakdown
    const bySeries = db.prepare(`
      SELECT 
        s.id, s.title,
        (SELECT COUNT(*) FROM chapters c JOIN seasons se ON c.season_id = se.id WHERE se.series_id = s.id) as total_chapters,
        (SELECT COUNT(*) FROM chapters c JOIN seasons se ON c.season_id = se.id WHERE se.series_id = s.id AND c.seen = 1) as seen_chapters,
        (SELECT AVG(c.rating) FROM chapters c JOIN seasons se ON c.season_id = se.id WHERE se.series_id = s.id AND c.seen = 1 AND c.rating IS NOT NULL) as avg_rating
      FROM series s
      WHERE s.user_id = ?
      ORDER BY seen_chapters DESC
    `).all(payload.userId)
    
    return NextResponse.json({ 
      global: {
        total_series: global.total_series,
        total_seasons: global.total_seasons,
        total_chapters: global.total_chapters,
        seen_chapters: global.seen_chapters,
        global_avg_rating: global.global_avg_rating,
        seen_percentage: global.total_chapters > 0 
          ? Math.round((global.seen_chapters / global.total_chapters) * 100) 
          : 0
      },
      bySeries 
    })
  } catch (error) {
    console.error('Stats error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
