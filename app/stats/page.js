'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function StatsPage() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetch('/api/stats')
      .then((r) => {
        if (r.status === 401) { router.push('/login'); return null }
        return r.json()
      })
      .then((data) => {
        if (data) setStats(data)
      })
      .finally(() => setLoading(false))
  }, [])

  const handleLogout = async () => {
    await fetch('/api/auth/me', { method: 'DELETE' })
    router.push('/login')
  }

  return (
    <div>
      <nav className="navbar">
        <h1>Estadísticas</h1>
        <div>
          <Link href="/dashboard" style={{ color: '#4a9eff', textDecoration: 'none', marginRight: 20 }}>
            Series
          </Link>
          <button onClick={handleLogout}>Cerrar sesión</button>
        </div>
      </nav>

      <div className="container">
        {loading ? (
          <div className="empty-state"><p>Cargando...</p></div>
        ) : !stats || !stats.global ? (
          <div className="empty-state"><h3>No hay datos todavía</h3></div>
        ) : (
          <>
            <h2 style={{ color: '#fff', marginBottom: 20 }}>Resumen Global</h2>
            
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-value">{stats.global.total_series || 0}</div>
                <div className="stat-label">Series</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{stats.global.total_seasons || 0}</div>
                <div className="stat-label">Temporadas</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{stats.global.seen_chapters || 0}</div>
                <div className="stat-label">Capítulos Vistos</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{stats.global.total_chapters || 0}</div>
                <div className="stat-label">Total Capítulos</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{stats.global.seen_percentage || 0}%</div>
                <div className="stat-label">Progreso</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">
                  {stats.global.global_avg_rating ? Number(stats.global.global_avg_rating).toFixed(1) : '-'}
                </div>
                <div className="stat-label">Rating Medio</div>
              </div>
            </div>

            <h2 style={{ color: '#fff', marginBottom: 20, marginTop: 40 }}>Por Serie</h2>

            {(!stats.bySeries || stats.bySeries.length === 0) ? (
              <div className="empty-state">
                <h3>Sin datos de series</h3>
              </div>
            ) : (
              stats.bySeries.map((s) => (
                <div key={s.id} className="card" style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h3 style={{ color: '#fff', marginBottom: 5 }}>{s.title}</h3>
                      <p style={{ color: '#888', fontSize: '0.85rem' }}>
                        {s.seen_chapters || 0}/{s.total_chapters || 0} capítulos ({s.total_chapters > 0 ? Math.round((s.seen_chapters / s.total_chapters) * 100) : 0}%)
                        {s.avg_rating ? ` · ★ ${Number(s.avg_rating).toFixed(1)}` : ''}
                      </p>
                    </div>
                    <Link
                      href={`/dashboard/${s.id}`}
                      style={{ color: '#4a9eff', textDecoration: 'none', fontSize: '0.9rem' }}
                    >
                      Ver →
                    </Link>
                  </div>
                  <div className="progress-bar" style={{ marginTop: 10 }}>
                    <div
                      className="progress-fill"
                      style={{ width: `${s.total_chapters > 0 ? Math.round((s.seen_chapters / s.total_chapters) * 100) : 0}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </>
        )}
      </div>
    </div>
  )
}
