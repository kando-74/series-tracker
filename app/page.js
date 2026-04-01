import { redirect } from 'next/navigation'
import { getUserFromCookies } from '@/lib/auth'

export default async function Home() {
  const user = await getUserFromCookies()
  if (user) {
    redirect('/dashboard')
  } else {
    redirect('/login')
  }
}
