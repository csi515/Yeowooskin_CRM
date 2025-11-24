import { cookies } from 'next/headers'

function base64UrlToString(input: string): string {
  const pad = input.length % 4 === 2 ? '==' : input.length % 4 === 3 ? '=' : ''
  const b64 = input.replace(/-/g, '+').replace(/_/g, '/') + pad
  return Buffer.from(b64, 'base64').toString('utf8')
}

export function getUserIdFromCookies(): string | null {
  try {
    const token = cookies().get('sb:token')?.value
    if (!token) return null
    const parts = token.split('.')
    if (parts.length < 2 || !parts[1]) return null
    const payload = JSON.parse(base64UrlToString(parts[1]))
    return payload?.sub || null
  } catch {
    return null
  }
}


