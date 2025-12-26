import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { withRateLimit, withErrorHandling, withAuth } from '@/app/lib/api/middleware'
import { createSuccessResponse } from '@/app/lib/api/handlers'

// 글자 수 제한 상수
const LIMITS = {
    NAME: 50,
    EMAIL: 100,
    PHONE: 20,
    SUBJECT: 100,
    MESSAGE: 2000,
}

// 문의 데이터 타입
interface InquiryData {
    name: string
    email: string
    phone?: string
    subject: string
    message: string
}

// 유효성 검사 함수
function validateInquiryData(data: InquiryData): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!data.name || data.name.trim().length === 0) {
        errors.push('이름을 입력해주세요.')
    } else if (data.name.length > LIMITS.NAME) {
        errors.push(`이름은 최대 ${LIMITS.NAME}자까지 입력 가능합니다.`)
    }

    if (!data.email || data.email.trim().length === 0) {
        errors.push('이메일을 입력해주세요.')
    } else if (data.email.length > LIMITS.EMAIL) {
        errors.push(`이메일은 최대 ${LIMITS.EMAIL}자까지 입력 가능합니다.`)
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        errors.push('올바른 이메일 형식이 아닙니다.')
    }

    if (data.phone && data.phone.length > LIMITS.PHONE) {
        errors.push(`전화번호는 최대 ${LIMITS.PHONE}자까지 입력 가능합니다.`)
    }

    if (!data.subject || data.subject.trim().length === 0) {
        errors.push('제목을 입력해주세요.')
    } else if (data.subject.length > LIMITS.SUBJECT) {
        errors.push(`제목은 최대 ${LIMITS.SUBJECT}자까지 입력 가능합니다.`)
    }

    if (!data.message || data.message.trim().length === 0) {
        errors.push('문의 내용을 입력해주세요.')
    } else if (data.message.length > LIMITS.MESSAGE) {
        errors.push(`문의 내용은 최대 ${LIMITS.MESSAGE}자까지 입력 가능합니다.`)
    }

    return {
        valid: errors.length === 0,
        errors,
    }
}

// POST: 새 문의 등록 (공개 API - 인증 불필요, Rate Limiting 적용)
export const POST = withRateLimit(
    withErrorHandling(async (request: NextRequest) => {
        const supabase = await createSupabaseServerClient()

        // 요청 본문 파싱
        const data: InquiryData = await request.json()

        // 유효성 검사
        const validation = validateInquiryData(data)
        if (!validation.valid) {
            return NextResponse.json(
                { error: '입력값이 올바르지 않습니다.', details: validation.errors },
                { status: 400 }
            )
        }

        // 데이터베이스에 삽입
        const { error } = await supabase
            .from('inquiries')
            .insert({
                name: data.name.trim(),
                email: data.email.trim(),
                phone: data.phone?.trim() || null,
                subject: data.subject.trim(),
                message: data.message.trim(),
                status: 'new',
            })

        if (error) {
            console.error('Error creating inquiry:', error)
            return NextResponse.json(
                { error: '문의 등록 중 오류가 발생했습니다.' },
                { status: 500 }
            )
        }

        return NextResponse.json(
            {
                success: true,
                message: '문의가 성공적으로 등록되었습니다. 빠른 시일 내에 답변드리겠습니다.',
            },
            { status: 201 }
        )
    })
)

// GET: 문의 목록 조회 (관리자 전용)
export const GET = withAuth(async (request: NextRequest, { userId, supabase }) => {
    // 관리자 권한 확인
    const { data: user } = await supabase.from('users').select('role').eq('id', userId).single()

    if (!user || user.role !== 'admin') {
        return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
    }

    // 쿼리 파라미터
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const offset = (page - 1) * limit

    // 문의 목록 조회
    let query = supabase
        .from('inquiries')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

    if (status && ['new', 'in_progress', 'resolved'].includes(status)) {
        query = query.eq('status', status)
    }

    const { data: inquiries, error, count } = await query

    if (error) {
        console.error('Error fetching inquiries:', error)
        return NextResponse.json(
            { error: '문의 목록을 가져오는 중 오류가 발생했습니다.' },
            { status: 500 }
        )
    }

    return createSuccessResponse({
        data: inquiries,
        pagination: {
            page,
            limit,
            total: count || 0,
            totalPages: Math.ceil((count || 0) / limit),
        },
    })
})
