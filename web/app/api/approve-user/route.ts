import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { createSupabaseServerAdmin } from '@/lib/supabase/server-admin'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
	try {
		const { userId, approved = true } = await req.json()
		if (!userId) {
			return NextResponse.json({ error: 'userId is required' }, { status: 400 })
		}
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
		const { data: me } = await supabase.from('users').select('role').eq('id', user.id).single()
		if (me?.role !== 'admin') return NextResponse.json({ error: 'forbidden' }, { status: 403 })

		const admin = createSupabaseServerAdmin()
		const { error } = await admin.from('users').update({ approved }).eq('id', userId)
		if (error) return NextResponse.json({ error: error.message }, { status: 400 })
		return NextResponse.json({ ok: true })
	} catch (e: any) {
		return NextResponse.json({ error: e?.message || 'unknown error' }, { status: 500 })
	}
}


