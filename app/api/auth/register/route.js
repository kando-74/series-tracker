import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { hashPassword, createToken } from '@/lib/auth'

export async function POST(request) {
  try {
    const { email, password } = await request.json()
    
    if (!email || !password) {
      return NextResponse.json({ error: 'Email y contraseña requeridos' }, { status: 400 })
    }
    
    if (password.length < 6) {
      return NextResponse.json({ error: 'La contraseña debe tener al menos 6 caracteres' }, { status: 400 })
    }
    
    const db = getDb()
    
    // Check if user exists
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email)
    if (existing) {
      return NextResponse.json({ error: 'El email ya está registrado' }, { status: 400 })
    }
    
    const passwordHash = await hashPassword(password)
    const result = db.prepare('INSERT INTO users (email, password_hash) VALUES (?, ?)').run(email, passwordHash)
    
    const token = await createToken(result.lastInsertRowid)
    
    const response = NextResponse.json({ success: true, userId: result.lastInsertRowid })
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/'
    })
    
    return response
  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json({ error: 'Error en el servidor' }, { status: 500 })
  }
}
