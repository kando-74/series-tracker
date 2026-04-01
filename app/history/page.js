'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

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
      boxShadow: '0 4px 12px rgba(0,0,0,0.3)', fontSize: '0.95rem'
    }}>
      {message}
    </div>
  )
}

export default function HistoryPage() {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const router = useRouter()
  
  const showToast = (message, type = 'success') => setToast({ message, type })
  
  useEffect(() => {
    async function fetchHistory() {
      try {
        const res = await fetch('/api/history')
        if (res.status === 401) { router.push('/login'); return }
        const data = await res.json()
        setHistory(data.history || [])
      } catch (err) {
        console.error('Error fetching history:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchHistory()
  }, [router])
  
  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleDateString('es-ES', { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    })
  }
  
  const groupByDate = (items) => {
    const groups = {}
    items.forEach(item => {
      const date = item.seen_date || 'Sin fecha'
      if (!groups[date]) groups[date] = []
      groups[date].push(item)
    })
    return groups
  }
  
  const grouped = groupByDate(history)
  const dates = Object.keys(grouped).sort((a, b) => {
    if (a === 'Sin fecha') return 1
    if (b === 'Sin fecha') return -1
    return new Date(b) - new Date(a)
  })
  
  return (
    <div>
      <nav className="navbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
          <a href="/dashboard" className="back-btn" style={{ margin: 0 }}>← Volver</a>
          <h1>Historial</h1>
        </div>
      </nav>
      
      <div className="container">
        <div className="list-header">
          <h2>Capítulos Vistos</h2>
          <p style={{ color: '#888', fontSize: '0.9rem' }}>{history.length} capítulos marcados como vistos</p>
        </div>
        
        {loading ? (
          <div className="empty-state"><p>Cargando...</p></div>
        ) : history.length === 0 ? (
          <div className="empty-state">
            <h3>Sin historial todavía</h3>
            <p>Marca capítulos como vistos para ver tu historial aquí</p>
          </div>
        ) : (
          <div>
            {dates.map(date => (
              <div key={date} style={{ marginBottom: 25 }}>
                <h3 style={{ color: '#888', fontSize: '0.9rem', marginBottom: 10, borderBottom: '1px solid var(--border)', paddingBottom: 5 }}>
                  {date === 'Sin fecha' ? 'Sin fecha' : formatDate(date)}
                </h3>
                {grouped[date].map(item => (
                  <div key={item.id} className="card" style={{ padding: 15, marginBottom: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <p style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>
                          {item.series_title} — T{item.season_number} E{item.chapter_number}
                        </p>
                        <p style={{ color: '#888', fontSize: '0.9rem' }}>
                          {item.chapter_title || `Capítulo ${item.chapter_number}`}
                        </p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        {item.rating && <p style={{ color: '#ffc107', fontSize: '1.1rem' }}>★ {item.rating}</p>}
                        <p style={{ color: '#4caf50', fontSize: '0.8rem' }}>✓ Visto</p>
                      </div>
                    </div>
                    {item.comments && (
                      <p style={{ color: '#aaa', fontSize: '0.85rem', marginTop: 8, fontStyle: 'italic' }}>
                        "{item.comments}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
      
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
