import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { createSupabaseServerAdmin } from '@/lib/supabase/server-admin'

export const dynamic = 'force-dynamic'

export async function POST() {
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

		const admin = createSupabaseServerAdmin()
		// 존재 체크
		const { data: existing } = await admin
			.from('users')
			.select('id')
			.eq('id', user.id)
			.maybeSingle()
		if (existing) return NextResponse.json({ ok: true })

		// 없으면 생성
		const payload = {
			id: user.id,
			email: user.email,
			name: (user.user_metadata as any)?.name ?? null,
			phone: (user.user_metadata as any)?.phone ?? null,
			birthdate: (user.user_metadata as any)?.birthdate ?? null,
		}
		const { error } = await admin.from('users').insert(payload)
		if (error) return NextResponse.json({ error: error.message }, { status: 400 })
		return NextResponse.json({ ok: true })
	} catch (e: any) {
		return NextResponse.json({ error: e?.message || 'unknown error' }, { status: 500 })
	}
}


