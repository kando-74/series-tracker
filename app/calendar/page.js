'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function CalendarPage() {
  const [watchData, setWatchData] = useState({})
  const [loading, setLoading] = useState(true)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const router = useRouter()
  
  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/history')
        if (res.status === 401) { router.push('/login'); return }
        const data = await res.json()
        const grouped = {}
        ;(data.history || []).forEach(item => {
          if (item.seen_date) {
            if (!grouped[item.seen_date]) grouped[item.seen_date] = []
            grouped[item.seen_date].push(item)
          }
        })
        setWatchData(grouped)
      } catch (err) { console.error('Error:', err) }
      finally { setLoading(false) }
    }
    fetchData()
  }, [router])
  
  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDay = new Date(year, month, 1).getDay()
  const monthNames = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
  const dayNames = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb']
  
  const days = []
  for (let i = 0; i < firstDay; i++) days.push(null)
  for (let i = 1; i <= daysInMonth; i++) days.push(i)
  
  return (
    <div>
      <nav className="navbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
          <a href="/dashboard" className="back-btn" style={{ margin: 0 }}>← Volver</a>
          <h1>Calendario</h1>
        </div>
      </nav>
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <button onClick={() => setCurrentMonth(new Date(year, month - 1, 1))} style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)', color: 'var(--text-primary)', padding: '8px 16px', borderRadius: 8, cursor: 'pointer' }}>←</button>
          <h2 style={{ color: 'var(--text-primary)' }}>{monthNames[month]} {year}</h2>
          <button onClick={() => setCurrentMonth(new Date(year, month + 1, 1))} style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)', color: 'var(--text-primary)', padding: '8px 16px', borderRadius: 8, cursor: 'pointer' }}>→</button>
        </div>
        {loading ? <div style={{ textAlign: 'center', padding: 40 }}>Cargando...</div> : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 5, marginBottom: 10 }}>
              {dayNames.map(d => <div key={d} style={{ textAlign: 'center', color: '#888', fontSize: '0.85rem', padding: 8 }}>{d}</div>)}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 5 }}>
              {days.map((day, idx) => {
                if (!day) return <div key={`empty-${idx}`} />
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                const dayData = watchData[dateStr]
                const isToday = dateStr === new Date().toISOString().split('T')[0]
                return (
                  <div key={day} style={{ background: dayData ? '#4caf50' : 'var(--bg-tertiary)', borderRadius: 8, padding: 10, minHeight: 70, border: isToday ? '2px solid var(--accent)' : '1px solid var(--border)' }}>
                    <div style={{ fontWeight: dayData ? 'bold' : 'normal', color: dayData ? '#fff' : 'var(--text-primary)', fontSize: '0.9rem' }}>{day}</div>
                    {dayData && <div style={{ fontSize: '0.75rem', color: '#fff', marginTop: 4 }}>{dayData.length} cap{dayData.length > 1 ? 's' : ''}</div>}
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
