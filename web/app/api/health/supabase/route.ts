import { NextResponse } from 'next/server'
import { createSupabaseServerAdmin } from '@/lib/supabase/server-admin'

export async function GET() {
  try {
    const supabase = createSupabaseServerAdmin()

    // 가장 단순한 쿼리로 연결 여부만 확인 (RLS 무시용 admin 클라이언트 사용)
    const { data, error } = await supabase.from('users').select('id').limit(1)

    if (error) {
      return NextResponse.json(
        { ok: false, message: error.message },
        { status: 500 },
      )
    }

    return NextResponse.json({
      ok: true,
      sampleCount: data?.length ?? 0,
    })
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, message: err?.message ?? 'Supabase health check failed' },
      { status: 500 },
    )
  }
}


