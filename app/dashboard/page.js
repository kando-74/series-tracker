'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

function Toast({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000)
    return () => clearTimeout(timer)
  }, [onClose])
  
  const bg = type === 'success' ? '#4caf50' : type === 'error' ? '#e53935' : '#4a9eff'
  
  return (
    <div style={{
      position: 'fixed', bottom: 20, right: 20, zIndex: 1000,
      background: bg, color: '#fff', padding: '12px 24px', borderRadius: 8,
      boxShadow: '0 4px 12px rgba(0,0,0,0.3)', fontSize: '0.95rem',
      animation: 'slideIn 0.3s ease'
    }}>
      {message}
    </div>
  )
}

function SearchCoversModal({ title, onSelect, onClose }) {
  const [covers, setCovers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searched, setSearched] = useState(false)
  
  useEffect(() => {
    async function search() {
      if (!title || title.length < 2) {
        setLoading(false)
        return
      }
      setLoading(true)
      setSearched(true)
      try {
        const res = await fetch(`https://api.tvmaze.com/search/shows?q=${encodeURIComponent(title)}`)
        const data = await res.json()
        setCovers(data.slice(0, 8).map(item => ({
          id: item.show.id,
          title: item.show.name,
          image: item.show.image?.medium || null,
          year: item.show.premiered?.split('-')[0] || null
        })))
      } catch {
        setCovers([])
      } finally {
        setLoading(false)
      }
    }
    search()
  }, [title])
  
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 650, maxHeight: '80vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
        <h2>Buscar portada para "{title}"</h2>
        
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ fontSize: '2rem', animation: 'spin 1s linear infinite' }}>🔍</div>
            <p style={{ marginTop: 10, color: '#888' }}>Buscando en TVMaze...</p>
          </div>
        ) : searched && covers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>
            <p>No se encontraron portadas para "{title}"</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginTop: 15 }}>
            {covers.map(c => (
              <div
                key={c.id}
                onClick={() => onSelect(c.image)}
                style={{
                  cursor: 'pointer', borderRadius: 8, overflow: 'hidden',
                  border: '3px solid transparent', transition: 'all 0.2s',
                  background: '#222'
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#4a9eff'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'transparent'}
              >
                {c.image ? (
                  <img src={c.image} alt={c.title} style={{ width: '100%', aspectRatio: '2/3', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', aspectRatio: '2/3', background: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>
                    🎬
                  </div>
                )}
                <p style={{ fontSize: '0.7rem', color: '#aaa', textAlign: 'center', padding: '5px 3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {c.title} {c.year && `(${c.year})`}
                </p>
              </div>
            ))}
          </div>
        )}
        
        <div style={{ marginTop: 20 }}>
          <div className="modal-actions" style={{ marginTop: 0 }}>
            <button className="btn btn-secondary" onClick={onClose}>Cerrar</button>
          </div>
        </div>
      </div>
    </div>
  )
}

function EditSerieModal({ serie, onClose, onSave }) {
  const [title, setTitle] = useState(serie.title)
  const [imageUrl, setImageUrl] = useState(serie.image_url || '')
  const [showCoverSearch, setShowCoverSearch] = useState(false)
  const [showManualUrl, setShowManualUrl] = useState(false)
  const [loading, setLoading] = useState(false)
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title.trim()) return
    setLoading(true)
    try {
      const res = await fetch('/api/series', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: serie.id, title: title.trim(), image_url: imageUrl || null })
      })
      if (res.ok) {
        onSave()
        onClose()
      }
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>Editar Serie</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Título</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} required />
          </div>
          
          {imageUrl && (
            <div style={{ marginBottom: 15, textAlign: 'center' }}>
              <p style={{ fontSize: '0.8rem', color: '#4caf50', marginBottom: 8 }}>Portada actual:</p>
              <img src={imageUrl} alt="cover" style={{ maxWidth: 100, maxHeight: 150, borderRadius: 8, objectFit: 'cover', border: '2px solid #4caf50' }} />
            </div>
          )}
          
          <button type="button" onClick={() => setShowCoverSearch(true)} style={{ width: '100%', padding: 12, marginBottom: 15, background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: '0.95rem' }}>
            🔍 Buscar nueva portada
          </button>
          
          {imageUrl && (
            <button type="button" onClick={() => setImageUrl('')} style={{ width: '100%', padding: 10, marginBottom: 15, background: '#333', color: '#e53935', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: '0.9rem' }}>
              ✕ Quitar portada
            </button>
          )}
          
          <button type="button" onClick={() => setShowManualUrl(!showManualUrl)} style={{ background: 'none', border: 'none', color: '#4a9eff', cursor: 'pointer', fontSize: '0.85rem', marginBottom: 10 }}>
            {showManualUrl ? '▲ Ocultar' : '▼ Añadir URL manualmente'}
          </button>
          
          {showManualUrl && (
            <div className="form-group" style={{ marginTop: 5 }}>
              <input type="url" value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://ejemplo.com/imagen.jpg" />
            </div>
          )}
          
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn" disabled={loading || !title.trim()}>{loading ? 'Guardando...' : '✓ Guardar cambios'}</button>
          </div>
        </form>
      </div>
      
      {showCoverSearch && (
        <SearchCoversModal title={title} onSelect={(url) => { setImageUrl(url); setShowCoverSearch(false) }} onClose={() => setShowCoverSearch(false)} />
      )}
    </div>
  )
}

function AddSerieModal({ onClose, onAdd }) {
  const [title, setTitle] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [showCoverSearch, setShowCoverSearch] = useState(false)
  const [showManualUrl, setShowManualUrl] = useState(false)
  const [loading, setLoading] = useState(false)
  
  const handleSubmit = async (e) => {
    e?.preventDefault()
    if (!title.trim()) return
    setLoading(true)
    try {
      const res = await fetch('/api/series', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), image_url: imageUrl || null })
      })
      if (res.ok) { onAdd(); onClose() }
    } finally { setLoading(false) }
  }
  
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>Nueva Serie</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Título de la serie</label>
            <input type="text" value={title} onChange={e => { setTitle(e.target.value); setImageUrl('') }} placeholder="Ej: Breaking Bad" required autoFocus />
          </div>
          
          <button type="button" onClick={() => title.length >= 2 && setShowCoverSearch(true)} disabled={title.length < 2} style={{ width: '100%', padding: 12, marginBottom: 15, background: title.length >= 2 ? '#6366f1' : '#333', color: '#fff', border: 'none', borderRadius: 8, cursor: title.length >= 2 ? 'pointer' : 'not-allowed', fontSize: '0.95rem' }}>
            🔍 Buscar portadas en TVMaze
          </button>
          
          {imageUrl && (
            <div style={{ marginBottom: 15, textAlign: 'center' }}>
              <p style={{ fontSize: '0.8rem', color: '#4caf50', marginBottom: 8 }}>✓ Portada seleccionada</p>
              <img src={imageUrl} alt="cover" style={{ maxWidth: 100, maxHeight: 150, borderRadius: 8, objectFit: 'cover', border: '2px solid #4caf50' }} />
              <button type="button" onClick={() => setImageUrl('')} style={{ display: 'block', margin: '8px auto 0', background: 'none', border: 'none', color: '#e53935', cursor: 'pointer', fontSize: '0.85rem' }}>✕ Quitar portada</button>
            </div>
          )}
          
          <button type="button" onClick={() => setShowManualUrl(!showManualUrl)} style={{ background: 'none', border: 'none', color: '#4a9eff', cursor: 'pointer', fontSize: '0.85rem', marginBottom: 10 }}>
            {showManualUrl ? '▲ Ocultar' : '▼ ¿Añadir URL de imagen manualmente?'}
          </button>
          
          {showManualUrl && (
            <div className="form-group" style={{ marginTop: 5 }}>
              <input type="url" value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://ejemplo.com/imagen.jpg" />
            </div>
          )}
          
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn" disabled={loading || !title.trim()}>{loading ? 'Añadiendo...' : '✓ Añadir Serie'}</button>
          </div>
        </form>
      </div>
      
      {showCoverSearch && (
        <SearchCoversModal title={title} onSelect={(url) => { setImageUrl(url); setShowCoverSearch(false) }} onClose={() => setShowCoverSearch(false)} />
      )}
    </div>
  )
}

function AddSeasonModal({ seriesId, onClose, onAdd }) {
  const [number, setNumber] = useState('')
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(false)
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/seasons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ series_id: seriesId, number: parseInt(number), title: title || null })
      })
      if (res.ok) { onAdd(); onClose() }
    } finally { setLoading(false) }
  }
  
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>Nueva Temporada</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Número de temporada</label>
            <input type="number" value={number} onChange={e => setNumber(e.target.value)} min="1" required autoFocus />
          </div>
          <div className="form-group">
            <label>Título (opcional)</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Ej: Temporada Final" />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn" disabled={loading}>{loading ? 'Añadiendo...' : 'Añadir'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const [theme, setTheme] = useState('dark')
  const [series, setSeries] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddSerie, setShowAddSerie] = useState(false)
  const [addingSeasonTo, setAddingSeasonTo] = useState(null)
  const [editingSerie, setEditingSerie] = useState(null)
  const [toast, setToast] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('recent') // recent, name, progress
  const router = useRouter()
  
  const showToast = (message, type = 'success') => setToast({ message, type })
  
  const fetchSeries = async () => {
    try {
      const res = await fetch('/api/series')
      if (res.status === 401) { router.push('/login'); return }
      const data = await res.json()
      setSeries(data.series || [])
    } catch { console.error('Error fetching series') }
    finally { setLoading(false) }
  }
  
  useEffect(() => {
    fetchSeries()
    // Load saved theme
    const saved = localStorage.getItem('theme') || 'dark'
    setTheme(saved)
    document.documentElement.setAttribute('data-theme', saved)
  }, [])
  
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])
  
  const handleLogout = async () => {
    await fetch('/api/auth/me', { method: 'DELETE' })
    router.push('/login')
  }
  
  const handleDeleteSerie = async (e, id) => {
    e.stopPropagation()
    if (!confirm('¿Eliminar esta serie y todo su contenido?')) return
    await fetch(`/api/series?id=${id}`, { method: 'DELETE' })
    fetchSeries()
    showToast('Serie eliminada')
  }
  
  const percentage = (seen, total) => total > 0 ? Math.round((seen / total) * 100) : 0
  
  // Filter and sort series
  const filteredSeries = series
    .filter(s => s.title.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'name') return a.title.localeCompare(b.title)
      if (sortBy === 'progress') return percentage(b.seen_count, b.chapter_count) - percentage(a.seen_count, a.chapter_count)
      return new Date(b.created_at) - new Date(a.created_at) // recent first
    })
  
  return (
    <div>
      <style>{`
        @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
      
      <nav className="navbar">
        <h1>Series Tracker</h1>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Link href="/history" style={{ color: '#4a9eff', textDecoration: 'none', marginRight: 15 }}>Historial</Link>
          <Link href="/stats" style={{ color: '#4a9eff', textDecoration: 'none', marginRight: 15 }}>Estadísticas</Link>
          <button onClick={handleLogout}>Cerrar sesión</button>
          <button className="theme-toggle" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} title="Cambiar tema">
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>
      </nav>
      
      <div className="container">
        <div className="list-header">
          <h2>Mis Series</h2>
          <button className="btn" onClick={() => setShowAddSerie(true)}>+ Nueva Serie</button>
        </div>
        
        {/* Search and Sort Bar */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="🔍 Buscar serie..."
              style={{ paddingLeft: 40, marginBottom: 0 }}
            />
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#666' }}>🔍</span>
          </div>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            style={{ width: 'auto', marginBottom: 0, minWidth: 140 }}
          >
            <option value="recent">Más recientes</option>
            <option value="name">Por nombre</option>
            <option value="progress">Por progreso</option>
          </select>
        </div>
        
        {loading ? (
          <div className="empty-state"><p>Cargando...</p></div>
        ) : filteredSeries.length === 0 ? (
          searchQuery ? (
            <div className="empty-state">
              <h3>No se encontraron series</h3>
              <p>Prueba con otro término de búsqueda</p>
            </div>
          ) : (
            <div className="empty-state">
              <h3>No tienes series todavía</h3>
              <p>Añade tu primera serie para empezar a rastrear</p>
            </div>
          )
        ) : (
          <>
            <p style={{ color: '#666', fontSize: '0.85rem', marginBottom: 15 }}>
              {filteredSeries.length} {filteredSeries.length === 1 ? 'serie' : 'series'}
              {searchQuery && ` que coinciden con "${searchQuery}"`}
            </p>
            <div className="series-grid">
              {filteredSeries.map((s) => (
                <div key={s.id} className="series-card">
                  <div style={{ position: 'relative' }}>
                    {s.image_url ? (
                      <img src={s.image_url} alt={s.title} style={{ width: '100%', aspectRatio: '2/3', objectFit: 'cover', borderRadius: 8, marginBottom: 10 }} onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }} />
                    ) : null}
                    {!s.image_url && (
                      <div style={{ width: '100%', aspectRatio: '2/3', background: 'linear-gradient(135deg, #333 0%, #222 100%)', borderRadius: 8, marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem' }}>🎬</div>
                    )}
                    <button onClick={(e) => { e.stopPropagation(); setEditingSerie(s) }} style={{ position: 'absolute', top: 5, left: 5, background: 'rgba(0,0,0,0.7)', border: 'none', color: '#4a9eff', cursor: 'pointer', fontSize: '0.9rem', width: 30, height: 30, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Editar serie">✎</button>
                    <button onClick={(e) => handleDeleteSerie(e, s.id)} style={{ position: 'absolute', top: 5, right: 5, background: 'rgba(0,0,0,0.7)', border: 'none', color: '#e53935', cursor: 'pointer', fontSize: '1.2rem', width: 30, height: 30, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Eliminar serie">×</button>
                  </div>
                  <h4 style={{ marginBottom: 5, cursor: 'pointer' }} onClick={() => router.push(`/dashboard/${s.id}`)}>{s.title}</h4>
                  <p style={{ fontSize: '0.8rem', color: '#888' }}>{s.season_count || 0} temp · {s.chapter_count || 0} caps</p>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${percentage(s.seen_count, s.chapter_count)}%` }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p style={{ fontSize: '0.8rem', color: '#888' }}>{s.seen_count || 0}/{s.chapter_count || 0} ({percentage(s.seen_count, s.chapter_count)}%)</p>
                    {s.avg_rating && <p style={{ fontSize: '0.85rem', color: '#ffc107' }}>★ {Number(s.avg_rating).toFixed(1)}</p>}
                  </div>
                  <button className="btn btn-secondary" style={{ width: '100%', marginTop: 10, padding: 8, fontSize: '0.85rem' }} onClick={() => setAddingSeasonTo(s.id)}>+ Temporada</button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      
      {showAddSerie && <AddSerieModal onClose={() => setShowAddSerie(false)} onAdd={() => { fetchSeries(); showToast('Serie añadida') }} />}
      {addingSeasonTo && <AddSeasonModal seriesId={addingSeasonTo} onClose={() => setAddingSeasonTo(null)} onAdd={() => { fetchSeries(); showToast('Temporada añadida') }} />}
      {editingSerie && <EditSerieModal serie={editingSerie} onClose={() => setEditingSerie(null)} onSave={() => { fetchSeries(); showToast('Serie actualizada') }} />}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
