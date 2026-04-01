import './globals.css'

export const metadata = {
  title: 'Series Tracker',
  description: 'Gestiona tus series, temporadas y capítulos',
}

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
