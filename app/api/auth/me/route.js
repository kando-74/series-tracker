import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { getUserFromCookies } from '@/lib/auth'

export async function GET() {
  try {
    const payload = await getUserFromCookies()
    
    if (!payload) {
      return NextResponse.json({ user: null }, { status: 401 })
    }
    
    const db = getDb()
    const user = db.prepare('SELECT id, email, created_at FROM users WHERE id = ?').get(payload.userId)
    
    if (!user) {
      return NextResponse.json({ user: null }, { status: 401 })
    }
    
    return NextResponse.json({ user })
  } catch (error) {
    console.error('Me error:', error)
    return NextResponse.json({ user: null }, { status: 401 })
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true })
  response.cookies.delete('auth_token')
  return response
}
