import './globals.css'
import { APP_VERSION, BUILD_DATE } from '@/lib/version'

export const metadata = {
  title: 'Series Tracker',
  description: 'Gestiona tus series, temporadas y capítulos',
}

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <div style={{
          position: 'fixed', bottom: 5, left: 5, zIndex: 999,
          fontSize: '0.65rem', color: '#444',
          fontFamily: 'monospace'
        }}>
          v{APP_VERSION} ({BUILD_DATE})
        </div>
        {children}
      </body>
    </html>
  )
}
