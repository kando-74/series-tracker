'use client'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'

function AddSeasonModal({ onClose, onAdd }) {
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
        body: JSON.stringify({ series_id: null, number: parseInt(number), title: title || null })
      })
      if (res.ok) { onAdd(); onClose() }
    } finally { setLoading(false) }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Nueva Temporada</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Número de temporada</label>
            <input type="number" value={number} onChange={(e) => setNumber(e.target.value)} min="1" required autoFocus />
          </div>
          <div className="form-group">
            <label>Título (opcional)</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej: Temporada Final" />
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

function EditSeasonModal({ season, onClose, onSave }) {
  const [number, setNumber] = useState(season.number)
  const [title, setTitle] = useState(season.title || '')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/seasons', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: season.id, number: parseInt(number), title: title || null })
      })
      if (res.ok) { onSave(); onClose() }
    } finally { setLoading(false) }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Editar Temporada</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Número de temporada</label>
            <input type="number" value={number} onChange={(e) => setNumber(e.target.value)} min="1" required autoFocus />
          </div>
          <div className="form-group">
            <label>Título (opcional)</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej: Temporada Final" />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn" disabled={loading}>{loading ? 'Guardando...' : 'Guardar'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function AddChapterModal({ seasonId, onClose, onAdd }) {
  const [number, setNumber] = useState('')
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/chapters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ season_id: seasonId, number: parseInt(number), title: title || null })
      })
      if (res.ok) { onAdd(); onClose() }
    } finally { setLoading(false) }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Nuevo Capítulo</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Número de capítulo</label>
            <input type="number" value={number} onChange={(e) => setNumber(e.target.value)} min="1" required autoFocus />
          </div>
          <div className="form-group">
            <label>Título (opcional)</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej: Pilot" />
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

function ChapterModal({ chapter, onClose, onSave }) {
  const [seen, setSeen] = useState(chapter.seen === 1)
  const [rating, setRating] = useState(chapter.rating || 0)
  const [seenDate, setSeenDate] = useState(chapter.seen_date || '')
  const [comments, setComments] = useState(chapter.comments || '')
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    setLoading(true)
    try {
      await fetch('/api/chapters', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: chapter.id,
          seen,
          rating: seen && rating > 0 ? rating : null,
          seen_date: seen && seenDate ? seenDate : null,
          comments: seen && comments ? comments : null
        })
      })
      onSave()
      onClose()
    } finally { setLoading(false) }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Capítulo {chapter.number}: {chapter.title || 'Sin título'}</h2>
        
        <div className="form-group">
          <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <input type="checkbox" className="checkbox-seen" checked={seen} onChange={(e) => setSeen(e.target.checked)} />
            Visto
          </label>
        </div>

        {seen && (
          <>
            <div className="form-group">
              <label>Valoración</label>
              <div className="rating-stars">
                {[1, 2, 3, 4, 5].map((n) => (
                  <span key={n} className={`star ${n <= rating ? 'active' : ''}`} onClick={() => setRating(n)}>★</span>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Fecha de visionado</label>
              <input type="date" value={seenDate} onChange={(e) => setSeenDate(e.target.value)} />
            </div>

            <div className="form-group">
              <label>Comentarios</label>
              <textarea value={comments} onChange={(e) => setComments(e.target.value)} placeholder="Tu opinión sobre el capítulo..." rows={4} />
            </div>
          </>
        )}

        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn" onClick={handleSave} disabled={loading}>{loading ? 'Guardando...' : 'Guardar'}</button>
        </div>
      </div>
    </div>
  )
}

export default function SerieDetailPage() {
  const router = useRouter()
  const params = useParams()
  const serieId = params.id

  const [serie, setSerie] = useState(null)
  const [seasons, setSeasons] = useState([])
  const [chapters, setChapters] = useState({})
  const [loading, setLoading] = useState(true)
  const [expandedSeason, setExpandedSeason] = useState(null)
  const [addingSeason, setAddingSeason] = useState(false)
  const [editingSeason, setEditingSeason] = useState(null)
  const [hoveredChapter, setHoveredChapter] = useState(null)
  const [addingChapterTo, setAddingChapterTo] = useState(null)
  const [editingChapter, setEditingChapter] = useState(null)

  const fetchSerie = async () => {
    try {
      const res = await fetch('/api/series')
      if (res.status === 401) { router.push('/login'); return }
      const data = await res.json()
      const s = data.series?.find((x) => x.id === parseInt(serieId))
      setSerie(s)
    } finally { setLoading(false) }
  }

  const fetchSeasons = async () => {
    const res = await fetch(`/api/seasons?series_id=${serieId}`)
    if (res.ok) {
      const data = await res.json()
      setSeasons(data.seasons || [])
    }
  }

  const fetchChapters = async (seasonId) => {
    const res = await fetch(`/api/chapters?season_id=${seasonId}`)
    if (res.ok) {
      const data = await res.json()
      setChapters((prev) => ({ ...prev, [seasonId]: data.chapters || [] }))
    }
  }

  const handleAddSeason = async (number, title) => {
    const res = await fetch('/api/seasons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ series_id: parseInt(serieId), number, title: title || null })
    })
    if (res.ok) { fetchSeasons(); setAddingSeason(false) }
  }

  useEffect(() => {
    fetchSerie()
    fetchSeasons()
  }, [serieId])

  useEffect(() => {
    if (expandedSeason && !chapters[expandedSeason]) {
      fetchChapters(expandedSeason)
    }
  }, [expandedSeason])

  const handleChapterSaved = () => {
    fetchSeasons()
    if (expandedSeason) fetchChapters(expandedSeason)
  }

  const handleQuickToggleSeen = async (e, ch) => {
    e.stopPropagation()
    const newSeen = ch.seen ? 0 : 1
    await fetch('/api/chapters', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: ch.id, seen: newSeen, seen_date: newSeen ? new Date().toISOString().split('T')[0] : null })
    })
    if (expandedSeason) fetchChapters(expandedSeason)
    fetchSeasons()
  }

  const handleMarkAllSeen = async (e, seasonId) => {
    e.stopPropagation()
    if (!confirm('¿Marcar todos los capítulos de esta temporada como vistos?')) return
    await fetch('/api/chapters', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ season_id: seasonId, mark_all_seen: true })
    })
    if (expandedSeason) fetchChapters(expandedSeason)
    fetchSeasons()
  }

  const handleDeleteSeason = async (e, seasonId) => {
    e.stopPropagation()
    if (!confirm('¿Eliminar esta temporada y sus capítulos?')) return
    await fetch(`/api/seasons?id=${seasonId}`, { method: 'DELETE' })
    fetchSeasons()
    if (expandedSeason === seasonId) setExpandedSeason(null)
  }

  const handleDeleteChapter = async (e, chapterId) => {
    e.stopPropagation()
    if (!confirm('¿Eliminar este capítulo?')) return
    await fetch(`/api/chapters?id=${chapterId}`, { method: 'DELETE' })
    if (expandedSeason) fetchChapters(expandedSeason)
    fetchSeasons()
  }

  const percentage = (seen, total) => total > 0 ? Math.round((seen / total) * 100) : 0

  return (
    <div>
      <nav className="navbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
          <a href="/dashboard" className="back-btn" style={{ margin: 0 }}>← Volver</a>
          <h1>{serie?.title || 'Cargando...'}</h1>
        </div>
      </nav>

      <div className="container">
        {loading ? (
          <div className="empty-state"><p>Cargando...</p></div>
        ) : !serie ? (
          <div className="empty-state"><h3>Serie no encontrada</h3></div>
        ) : (
          <>
            <div className="list-header">
              <h2>Temporadas</h2>
              <button className="btn btn-secondary" onClick={() => setAddingSeason(true)}>
                + Nueva Temporada
              </button>
            </div>

            {seasons.length === 0 ? (
              <div className="empty-state">
                <h3>Sin temporadas</h3>
                <p>Añade temporadas y capítulos para empezar a rastrear</p>
              </div>
            ) : (
              seasons.map((season) => (
                <div key={season.id} className="season-card">
                  <div
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                    onClick={() => setExpandedSeason(expandedSeason === season.id ? null : season.id)}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <h4 style={{ margin: 0 }}>Temporada {season.number}</h4>
                        <button
                          onClick={(e) => { e.stopPropagation(); setEditingSeason(season) }}
                          style={{ background: 'none', border: 'none', color: '#4a9eff', cursor: 'pointer', fontSize: '0.85rem', padding: '2px 6px' }}
                          title="Editar temporada"
                        >
                          ✎
                        </button>
                      </div>
                      <p style={{ color: '#888', fontSize: '0.85rem' }}>
                        {season.season_count || 0} capítulos · {season.seen_count || 0} vistos
                        {season.avg_rating ? ` · ★ ${Number(season.avg_rating).toFixed(1)}` : ''}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <div className="progress-bar" style={{ width: 100, margin: 0 }}>
                        <div className="progress-fill" style={{ width: `${percentage(season.seen_count, season.season_count)}%` }} />
                      </div>
                      <button
                        onClick={(e) => handleMarkAllSeen(e, season.id)}
                        style={{ background: '#4caf50', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '0.75rem', padding: '4px 8px', borderRadius: 4 }}
                        title="Marcar todos como vistos"
                      >
                        ✓ Ver
                      </button>
                      <button
                        onClick={(e) => handleDeleteSeason(e, season.id)}
                        style={{ background: 'none', border: 'none', color: '#e53935', cursor: 'pointer', fontSize: '1.2rem' }}
                      >
                        ×
                      </button>
                    </div>
                  </div>

                  {expandedSeason === season.id && (
                    <div style={{ marginTop: 15, borderTop: '1px solid #333', paddingTop: 15 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                        <button className="btn btn-secondary" style={{ padding: 8 }} onClick={() => setAddingChapterTo(season.id)}>
                          + Capítulo
                        </button>
                      </div>

                      {(chapters[season.id] || []).map((ch) => (
                        <div
                          key={ch.id}
                          className={`chapter-item ${ch.seen ? 'seen' : 'not-seen'}`}
                          onMouseEnter={() => setHoveredChapter(ch.id)}
                          onMouseLeave={() => setHoveredChapter(null)}
                          style={{ position: 'relative' }}
                        >
                          <div className="chapter-number">Cap {ch.number}</div>
                          <div className="chapter-title" style={{ cursor: 'pointer' }} onClick={() => setEditingChapter(ch)}>{ch.title || `Capítulo ${ch.number}`}</div>
                          {ch.seen && ch.rating && <div className="chapter-rating">★ {ch.rating}</div>}
                          <button
                            onClick={(e) => handleQuickToggleSeen(e, ch)}
                            style={{
                              background: ch.seen ? '#4caf50' : '#333',
                              border: 'none',
                              color: ch.seen ? '#fff' : '#888',
                              cursor: 'pointer',
                              fontSize: '0.75rem',
                              padding: '4px 8px',
                              borderRadius: 4,
                              marginLeft: 5
                            }}
                            title={ch.seen ? 'Marcar como no visto' : 'Marcar como visto'}
                          >
                            {ch.seen ? '✓' : '○'}
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); setEditingChapter(ch) }} style={{ background: 'none', border: 'none', color: '#4a9eff', cursor: 'pointer', marginLeft: 5 }} title="Editar">✎</button>
                          <button onClick={(e) => handleDeleteChapter(e, ch.id)} style={{ background: 'none', border: 'none', color: '#e53935', cursor: 'pointer', marginLeft: 5 }}>×</button>
                        </div>
                        {hoveredChapter === ch.id && (ch.seen || ch.rating || ch.comments) && (
                          <div style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            right: 0,
                            background: 'var(--bg-secondary)',
                            border: '1px solid var(--border)',
                            borderRadius: 6,
                            padding: 10,
                            zIndex: 10,
                            fontSize: '0.8rem',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                            marginTop: 4
                          }}>
                            {ch.rating && <p style={{ color: '#ffc107', marginBottom: 4 }}>★ {ch.rating}/10</p>}
                            {ch.seen_date && <p style={{ color: '#888', marginBottom: 4 }}>📅 {ch.seen_date}</p>}
                            {ch.comments && <p style={{ color: '#aaa', fontStyle: 'italic' }}>"{ch.comments.substring(0, 60)}{ch.comments.length > 60 ? '...' : ''}"</p>}
                            {!ch.seen && !ch.rating && !ch.comments && <p style={{ color: '#888' }}>Sin calificar</p>}
                          </div>
                        )}
                      ))}

                      {(chapters[season.id] || []).length === 0 && (
                        <p style={{ color: '#666', textAlign: 'center', padding: 15 }}>Sin capítulos todavía</p>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </>
        )}
      </div>

      {addingSeason && (
        <div className="modal-overlay" onClick={() => setAddingSeason(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Nueva Temporada</h2>
            <form onSubmit={(e) => {
              e.preventDefault()
              const num = e.target.number.value
              const tit = e.target.title.value
              handleAddSeason(parseInt(num), tit)
            }}>
              <div className="form-group">
                <label>Número de temporada</label>
                <input type="number" name="number" min="1" required autoFocus />
              </div>
              <div className="form-group">
                <label>Título (opcional)</label>
                <input type="text" name="title" placeholder="Ej: Temporada Final" />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setAddingSeason(false)}>Cancelar</button>
                <button type="submit" className="btn">Añadir</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {addingChapterTo && (
        <AddChapterModal
          seasonId={addingChapterTo}
          onClose={() => setAddingChapterTo(null)}
          onAdd={() => { fetchChapters(addingChapterTo); fetchSeasons() }}
        />
      )}

      {editingChapter && (
        <ChapterModal
          chapter={editingChapter}
          onClose={() => setEditingChapter(null)}
          onSave={handleChapterSaved}
        />
      )}

      {editingSeason && (
        <EditSeasonModal
          season={editingSeason}
          onClose={() => setEditingSeason(null)}
          onSave={() => { fetchSeasons(); if (expandedSeason) fetchChapters(expandedSeason) }}
        />
      )}
    </div>
  )
}
