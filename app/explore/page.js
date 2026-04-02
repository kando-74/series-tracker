'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

function Toast({ message, onClose }) {
  setTimeout(onClose, 3000)
  return (
    <div style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 1000, background: '#4caf50', color: '#fff', padding: '12px 24px', borderRadius: 8 }}>
      {message}
    </div>
  )
}

export default function ExplorePage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [importing, setImporting] = useState(null)
  const [toast, setToast] = useState(null)
  const router = useRouter()
  
  const search = async (e) => {
    e?.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    try {
      const res = await fetch(`https://api.tvmaze.com/search/shows?q=${encodeURIComponent(query)}`)
      const data = await res.json()
      setResults(data)
    } finally { setLoading(false) }
  }
  
  const importShow = async (show) => {
    setImporting(show.show.id)
    try {
      // Create series
      const res = await fetch('/api/series', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: show.show.name, image_url: show.show.image?.medium || null })
      })
      const data = await res.json()
      const seriesId = data.series?.id
      if (!seriesId) throw new Error('Failed')
      
      // Get seasons
      const seasonsRes = await fetch(`https://api.tvmaze.com/shows/${show.show.id}/seasons`)
      const seasons = await seasonsRes.json()
      
      for (const season of seasons) {
        const seasonRes = await fetch('/api/seasons', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ series_id: seriesId, number: season.number, title: season.name || null })
        })
        const sData = await seasonRes.json()
        const seasonId = sData.season?.id
        if (!seasonId) continue
        
        const epsRes = await fetch(`https://api.tvmaze.com/seasons/${season.id}/episodes`)
        const episodes = await epsRes.json()
        
        for (const ep of episodes) {
          await fetch('/api/chapters', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ season_id: seasonId, number: ep.number, title: ep.name || null })
          })
        }
      }
      
      setToast(`${show.show.name} importada con ${seasons.length} temporadas`)
      setResults(results.filter(r => r.show.id !== show.show.id))
    } catch (err) {
      console.error(err)
      setToast('Error al importar')
    } finally { setImporting(null) }
  }
  
  return (
    <div>
      <nav className="navbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
          <a href="/dashboard" className="back-btn" style={{ margin: 0 }}>← Volver</a>
          <h1>Explorar Series</h1>
        </div>
      </nav>
      
      <div className="container">
        <form onSubmit={search} style={{ marginBottom: 25 }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Buscar series en TVMaze... (ej: Breaking Bad)"
              style={{ flex: 1, marginBottom: 0 }}
              autoFocus
            />
            <button type="submit" className="btn" disabled={loading || !query.trim()}>
              {loading ? '...' : '🔍'}
            </button>
          </div>
        </form>
        
        {results.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 15 }}>
            {results.map(show => (
              <div key={show.show.id} style={{ background: 'var(--bg-secondary)', borderRadius: 12, padding: 15, border: '1px solid var(--border)' }}>
                {show.show.image?.medium ? (
                  <img src={show.show.image.medium} alt={show.show.name} style={{ width: '100%', aspectRatio: '2/3', objectFit: 'cover', borderRadius: 8, marginBottom: 10 }} />
                ) : (
                  <div style={{ width: '100%', aspectRatio: '2/3', background: 'linear-gradient(135deg, #333, #222)', borderRadius: 8, marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem' }}>🎬</div>
                )}
                <h4 style={{ color: 'var(--text-primary)', marginBottom: 5, fontSize: '0.95rem' }}>{show.show.name}</h4>
                <p style={{ color: '#888', fontSize: '0.8rem', marginBottom: 8 }}>
                  {show.show.premiered?.split('-')[0] || '?'} · {show.show.genres?.slice(0,2).join(', ')}
                </p>
                {show.show.summary && (
                  <p style={{ color: '#aaa', fontSize: '0.8rem', marginBottom: 10, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
                    {show.show.summary.replace(/<[^>]*>/g, '')}
                  </p>
                )}
                <button
                  onClick={() => importShow(show)}
                  disabled={importing === show.show.id}
                  className="btn"
                  style={{ width: '100%', padding: 8, fontSize: '0.9rem', background: importing === show.show.id ? 'var(--bg-tertiary)' : '#4caf50' }}
                >
                  {importing === show.show.id ? 'Importando...' : '📥 Importar'}
                </button>
              </div>
            ))}
          </div>
        )}
        
        {!loading && results.length === 0 && query && (
          <div className="empty-state">
            <h3>Sin resultados</h3>
            <p>Prueba con otro término de búsqueda</p>
          </div>
        )}
        
        {!loading && results.length === 0 && !query && (
          <div className="empty-state">
            <h3>🔍 Explora series de TV</h3>
            <p>Busca cualquier serie en TVMaze e impórtala directamente con todas sus temporadas y capítulos</p>
          </div>
        )}
      </div>
      
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  )
}
