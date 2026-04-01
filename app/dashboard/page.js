'use client'
import { useState, useEffect, useCallback } from 'react'
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
  
  useEffect(() => {
    async function search() {
      if (!title || title.length < 2) { setLoading(false); return }
      try {
        const res = await fetch(`https://api.tvmaze.com/search/shows?q=${encodeURIComponent(title)}`)
        const data = await res.json()
        setCovers(data.slice(0, 6).map(item => ({
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
    const timer = setTimeout(search, 400)
    return () => clearTimeout(timer)
  }, [title])
  
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 600 }} onClick={e => e.stopPropagation()}>
        <h2>Buscar portada para "{title}"</h2>
        {loading ? (
          <p style={{ textAlign: 'center', color: '#888' }}>Buscando...</p>
        ) : covers.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#888' }}>No se encontraron portadas</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginTop: 15 }}>
            {covers.map(c => (
              <div
                key={c.id}
                onClick={() => onSelect(c.image)}
                style={{
                  cursor: 'pointer', borderRadius: 8, overflow: 'hidden',
                  border: '2px solid transparent', transition: 'border-color 0.2s'
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
                <p style={{ fontSize: '0.75rem', color: '#aaa', textAlign: 'center', padding: '5px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {c.title} {c.year && `(${c.year})`}
                </p>
              </div>
            ))}
          </div>
        )}
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
        </div>
      </div>
    </div>
  )
}

function AddSerieModal({ onClose, onAdd }) {
  const [title, setTitle] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [manualUrl, setManualUrl] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showCoverSearch, setShowCoverSearch] = useState(false)
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title.trim()) return
    setLoading(true)
    try {
      const res = await fetch('/api/series', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), image_url: imageUrl || null })
      })
      if (res.ok) {
        onAdd()
        onClose()
      }
    } finally {
      setLoading(false)
    }
  }
  
  const handleTitleBlur = () => {
    if (title.length >= 3 && !imageUrl) {
      setShowCoverSearch(true)
    }
  }
  
  const handleCoverSelect = (url) => {
    setImageUrl(url)
    setShowCoverSearch(false)
  }
  
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>Nueva Serie</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Título de la serie</label>
            <input
              type="text"
              value={title}
              onChange={e => { setTitle(e.target.value); setImageUrl(''); setManualUrl(false) }}
              onBlur={handleTitleBlur}
              placeholder="Escribe el nombre y espera..."
              required
              autoFocus
            />
          </div>
          
          {imageUrl && (
            <div style={{ marginBottom: 15, textAlign: 'center' }}>
              <img src={imageUrl} alt="cover" style={{ maxWidth: 120, maxHeight: 180, borderRadius: 8, objectFit: 'cover' }} />
              <p style={{ fontSize: '0.8rem', color: '#888', marginTop: 5 }}>Portada seleccionada</p>
            </div>
          )}
          
          <div className="form-group">
            <label
              onClick={() => setManualUrl(!manualUrl)}
              style={{ cursor: 'pointer', color: '#4a9eff', fontSize: '0.85rem' }}
            >
              {manualUrl ? '▲ Ocultar URL manual' : '▼ ¿Añadir URL de imagen manualmente?'}
            </label>
            {manualUrl && (
              <input
                type="url"
                value={imageUrl}
                onChange={e => setImageUrl(e.target.value)}
                placeholder="https://..."
              />
            )}
          </div>
          
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn" disabled={loading || !title.trim()}>
              {loading ? 'Añadiendo...' : 'Añadir Serie'}
            </button>
          </div>
        </form>
      </div>
      
      {showCoverSearch && (
        <SearchCoversModal
          title={title}
          onSelect={handleCoverSelect}
          onClose={() => setShowCoverSearch(false)}
        />
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
  const [series, setSeries] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddSerie, setShowAddSerie] = useState(false)
  const [addingSeasonTo, setAddingSeasonTo] = useState(null)
  const [toast, setToast] = useState(null)
  const router = useRouter()
  
  const showToast = (message, type = 'success') => {
    setToast({ message, type })
  }
  
  const fetchSeries = async () => {
    try {
      const res = await fetch('/api/series')
      if (res.status === 401) { router.push('/login'); return }
      const data = await res.json()
      setSeries(data.series || [])
    } catch { console.error('Error fetching series') }
    finally { setLoading(false) }
  }
  
  useEffect(() => { fetchSeries() }, [])
  
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
  
  return (
    <div>
      <style>{`@keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`}</style>
      
      <nav className="navbar">
        <h1>Series Tracker</h1>
        <div>
          <Link href="/stats" style={{ color: '#4a9eff', textDecoration: 'none', marginRight: 20 }}>Estadísticas</Link>
          <button onClick={handleLogout}>Cerrar sesión</button>
        </div>
      </nav>
      
      <div className="container">
        <div className="list-header">
          <h2>Mis Series</h2>
          <button className="btn" onClick={() => setShowAddSerie(true)}>+ Nueva Serie</button>
        </div>
        
        {loading ? (
          <div className="empty-state"><p>Cargando...</p></div>
        ) : series.length === 0 ? (
          <div className="empty-state">
            <h3>No tienes series todavía</h3>
            <p>Añade tu primera serie para empezar a rastrear</p>
          </div>
        ) : (
          <div className="series-grid">
            {series.map((s) => (
              <div
                key={s.id}
                className="series-card"
                onClick={() => router.push(`/dashboard/${s.id}`)}
              >
                <div style={{ position: 'relative' }}>
                  {s.image_url ? (
                    <img
                      src={s.image_url}
                      alt={s.title}
                      style={{ width: '100%', aspectRatio: '2/3', objectFit: 'cover', borderRadius: 8, marginBottom: 10 }}
                      onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }}
                    />
                  ) : null}
                  {!s.image_url && (
                    <div style={{
                      width: '100%', aspectRatio: '2/3', background: 'linear-gradient(135deg, #333 0%, #222 100%)',
                      borderRadius: 8, marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '3rem'
                    }}>
                      🎬
                    </div>
                  )}
                  <button
                    onClick={(e) => handleDeleteSerie(e, s.id)}
                    style={{
                      position: 'absolute', top: 5, right: 5, background: 'rgba(0,0,0,0.7)', border: 'none',
                      color: '#e53935', cursor: 'pointer', fontSize: '1.2rem', width: 30, height: 30,
                      borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}
                    title="Eliminar serie"
                  >
                    ×
                  </button>
                </div>
                <h4 style={{ marginBottom: 5 }}>{s.title}</h4>
                <p style={{ fontSize: '0.8rem', color: '#888' }}>{s.season_count || 0} temp · {s.chapter_count || 0} caps</p>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${percentage(s.seen_count, s.chapter_count)}%` }} />
                </div>
                <p style={{ fontSize: '0.8rem', color: '#888', textAlign: 'center' }}>
                  {s.seen_count || 0}/{s.chapter_count || 0} ({percentage(s.seen_count, s.chapter_count)}%)
                </p>
                <button
                  className="btn btn-secondary"
                  style={{ width: '100%', marginTop: 10, padding: 8, fontSize: '0.85rem' }}
                  onClick={(e) => { e.stopPropagation(); setAddingSeasonTo(s.id) }}
                >
                  + Temporada
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {showAddSerie && (
        <AddSerieModal
          onClose={() => setShowAddSerie(false)}
          onAdd={() => { fetchSeries(); showToast('Serie añadida') }}
        />
      )}
      
      {addingSeasonTo && (
        <AddSeasonModal
          seriesId={addingSeasonTo}
          onClose={() => setAddingSeasonTo(null)}
          onAdd={() => { fetchSeries(); showToast('Temporada añadida') }}
        />
      )}
      
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
