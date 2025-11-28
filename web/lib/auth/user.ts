import { cookies } from 'next/headers'

function base64UrlToString(input: string): string {
  const pad = input.length % 4 === 2 ? '==' : input.length % 4 === 3 ? '=' : ''
  const b64 = input.replace(/-/g, '+').replace(/_/g, '/') + pad
  return Buffer.from(b64, 'base64').toString('utf8')
}

export function getUserIdFromCookies(): string | null {
  try {
    const cookieStore = cookies()
    const token = cookieStore.get('sb:token')?.value || cookieStore.get('sb-access-token')?.value
    if (!token) return null

    const parts = token.split('.')
    if (parts.length < 2) return null

    const payload = JSON.parse(base64UrlToString(parts[1]!))

    // 토큰 만료 확인
    if (payload.exp && Date.now() >= payload.exp * 1000) {
      return null
    }

    return payload?.sub || null
  } catch {
    return null
  }
}


