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

export default function SettingsPage() {
  const [toast, setToast] = useState(null)
  const [importing, setImporting] = useState(false)
  const router = useRouter()
  
  const showToast = (message, type = 'success') => setToast({ message, type })
  
  const handleExport = async () => {
    try {
      const res = await fetch('/api/export')
      if (res.status === 401) { router.push('/login'); return }
      
      const data = await res.json()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `series-tracker-backup-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      showToast('Backup exportado correctamente')
    } catch (err) {
      showToast('Error al exportar', 'error')
    }
  }
  
  const handleImport = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    
    if (!confirm('¿Importar datos? Los datos existentes no se borrarán, se añadirán nuevos.')) {
      return
    }
    
    setImporting(true)
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      
      const res = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data })
      })
      
      if (res.status === 401) { router.push('/login'); return }
      
      const result = await res.json()
      if (result.success) {
        showToast(`Importados ${result.imported} series correctamente`)
      } else {
        showToast(result.error || 'Error al importar', 'error')
      }
    } catch (err) {
      showToast('Archivo inválido o corrupto', 'error')
    } finally {
      setImporting(false)
    }
  }
  
  return (
    <div>
      <nav className="navbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
          <a href="/dashboard" className="back-btn" style={{ margin: 0 }}>← Volver</a>
          <h1>Configuración</h1>
        </div>
      </nav>
      
      <div className="container">
        <div className="card" style={{ marginBottom: 15 }}>
          <h3 style={{ marginBottom: 15 }}>Backup y Restauración</h3>
          
          <div style={{ display: 'flex', gap: 15, flexWrap: 'wrap', marginBottom: 20 }}>
            <button className="btn" onClick={handleExport}>
              📤 Exportar datos
            </button>
            
            <label className="btn btn-secondary" style={{ cursor: 'pointer' }}>
              📥 Importar datos
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                disabled={importing}
                style={{ display: 'none' }}
              />
            </label>
          </div>
          
          <p style={{ color: '#888', fontSize: '0.85rem' }}>
            Exporta tus datos a un archivo JSON. Puedes usar este archivo para hacer backup o迁移 a otro dispositivo.
          </p>
        </div>
        
        <div className="card">
          <h3 style={{ marginBottom: 10 }}>Acerca de</h3>
          <p style={{ color: '#888', fontSize: '0.9rem' }}>
            Series Tracker v1.5.0<br/>
            Tu gestor personal de series de TV
          </p>
        </div>
      </div>
      
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
