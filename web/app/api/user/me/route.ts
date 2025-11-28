import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
	try {
		const supabase = createSupabaseServerClient()
		const { data: { user }, error: authError } = await supabase.auth.getUser()

		// 토큰 만료 또는 유효하지 않은 경우
		if (authError) {
			const isExpired = authError.message.includes('expired') || authError.message.includes('invalid')
			if (isExpired) {
				return NextResponse.json(
					{ error: 'TOKEN_EXPIRED', message: '세션이 만료되었습니다. 다시 로그인해주세요.' },
					{ status: 401 }
				)
			}
			return NextResponse.json({ error: 'unauthorized', message: authError.message }, { status: 401 })
		}

		if (!user) {
			return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
		}

		const { data, error } = await supabase
			.from('users')
			.select('id, approved, name, email')
			.eq('id', user.id)
			.maybeSingle()

		if (error) {
			return NextResponse.json({ error: error.message }, { status: 400 })
		}

		return NextResponse.json({ profile: data })
	} catch (e: unknown) {
		console.error('API /user/me error:', e)
		const message = e instanceof Error ? e.message : 'unknown error'
		return NextResponse.json({ error: message }, { status: 500 })
	}
}

