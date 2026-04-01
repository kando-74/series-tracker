'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

function AddSerieModal({ onClose, onAdd }) {
  const [title, setTitle] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/series', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, image_url: imageUrl || null })
      })
      if (res.ok) {
        onAdd()
        onClose()
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Nueva Serie</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Título de la serie</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Breaking Bad"
              required
              autoFocus
            />
          </div>
          <div className="form-group">
            <label>URL de imagen (opcional)</label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn" disabled={loading}>
              {loading ? 'Añadiendo...' : 'Añadir Serie'}
            </button>
          </div>
        </form>
      </div>
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
      if (res.ok) {
        onAdd()
        onClose()
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Nueva Temporada</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Número de temporada</label>
            <input
              type="number"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              placeholder="1"
              min="1"
              required
              autoFocus
            />
          </div>
          <div className="form-group">
            <label>Título (opcional)</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Temporada Final"
            />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn" disabled={loading}>
              {loading ? 'Añadiendo...' : 'Añadir'}
            </button>
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
  const router = useRouter()

  const fetchSeries = async () => {
    try {
      const res = await fetch('/api/series')
      if (res.status === 401) {
        router.push('/login')
        return
      }
      const data = await res.json()
      setSeries(data.series || [])
    } catch {
      console.error('Error fetching series')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSeries()
  }, [])

  const handleLogout = async () => {
    await fetch('/api/auth/me', { method: 'DELETE' })
    router.push('/login')
  }

  const handleDeleteSerie = async (e, id) => {
    e.stopPropagation()
    if (!confirm('¿Eliminar esta serie y todo su contenido?')) return
    await fetch(`/api/series?id=${id}`, { method: 'DELETE' })
    fetchSeries()
  }

  const percentage = (seen, total) => total > 0 ? Math.round((seen / total) * 100) : 0

  return (
    <div>
      <nav className="navbar">
        <h1>Series Tracker</h1>
        <div>
          <Link href="/stats" style={{ color: '#4a9eff', textDecoration: 'none', marginRight: 20 }}>
            Estadísticas
          </Link>
          <button onClick={handleLogout}>Cerrar sesión</button>
        </div>
      </nav>

      <div className="container">
        <div className="list-header">
          <h2>Mis Series</h2>
          <button className="btn" onClick={() => setShowAddSerie(true)}>
            + Nueva Serie
          </button>
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h4>{s.title}</h4>
                  <button
                    onClick={(e) => handleDeleteSerie(e, s.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#e53935',
                      cursor: 'pointer',
                      fontSize: '1.2rem',
                      padding: 0
                    }}
                    title="Eliminar serie"
                  >
                    ×
                  </button>
                </div>
                {s.image_url && (
                  <img
                    src={s.image_url}
                    alt={s.title}
                    style={{ width: '100%', borderRadius: 8, marginBottom: 10, maxHeight: 150, objectFit: 'cover' }}
                    onError={(e) => { e.target.style.display = 'none' }}
                  />
                )}
                <p>{s.season_count || 0} temporadas · {s.chapter_count || 0} capítulos</p>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${percentage(s.seen_count, s.chapter_count)}%` }}
                  />
                </div>
                <p style={{ fontSize: '0.8rem', color: '#888' }}>
                  {s.seen_count || 0}/{s.chapter_count || 0} vistos ({percentage(s.seen_count, s.chapter_count)}%)
                </p>
                <button
                  className="btn btn-secondary"
                  style={{ width: '100%', marginTop: 10, padding: 8 }}
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
          onAdd={fetchSeries}
        />
      )}

      {addingSeasonTo && (
        <AddSeasonModal
          seriesId={addingSeasonTo}
          onClose={() => setAddingSeasonTo(null)}
          onAdd={fetchSeries}
        />
      )}
    </div>
  )
}
