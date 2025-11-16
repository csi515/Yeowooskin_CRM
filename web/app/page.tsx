import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Landing from './components/Landing'

export default function HomePage() {
  const hasSession = Boolean(
    cookies().get('sb:token') ||
    cookies().get('sb-access-token') ||
    cookies().get('sb:client:session')
  )
  if (hasSession) {
    redirect('/dashboard')
  }
  return (
    <Landing />
  )
}
