import { NextRequest } from 'next/server'
import { withAuth } from '@/app/lib/api/middleware'
import { parseQueryParams, parseAndValidateBody, createSuccessResponse } from '@/app/lib/api/handlers'
import { StaffRepository } from '@/app/lib/repositories/staff.repository'
import { staffCreateSchema } from '@/app/lib/api/schemas'

export const GET = withAuth(async (req: NextRequest, { userId, supabase }) => {
  const params = parseQueryParams(req)
  const repository = new StaffRepository(userId, supabase)
  const data = await repository.findAll(params)
  return createSuccessResponse(data)
})

export const POST = withAuth(async (req: NextRequest, { userId, supabase }) => {
  try {
    // 먼저 raw body를 가져옴
    const rawBody = await req.json()
    
    // 빈 문자열을 null로 변환
    const normalizedBody = {
      name: rawBody.name || '',
      phone: rawBody.phone === '' ? null : rawBody.phone || null,
      email: rawBody.email === '' ? null : rawBody.email || null,
      role: rawBody.role === '' ? null : rawBody.role || null,
      notes: rawBody.notes === '' ? null : rawBody.notes || null,
      active: rawBody.active !== undefined ? Boolean(rawBody.active) : true,
    }
    
    // 스키마 검증 (실패해도 계속 진행)
    let validatedBody
    try {
      validatedBody = staffCreateSchema.parse(normalizedBody)
    } catch (validationError) {
      // 검증 실패해도 기본값 사용
      validatedBody = {
        name: normalizedBody.name || '이름 없음',
        phone: normalizedBody.phone,
        email: normalizedBody.email,
        role: normalizedBody.role,
        notes: normalizedBody.notes,
        active: normalizedBody.active,
      }
    }
    
    const repository = new StaffRepository(userId, supabase)
    // exactOptionalPropertyTypes를 위한 타입 변환
    const body: Parameters<typeof repository.createStaff>[0] = {
      name: validatedBody.name || '이름 없음',
      active: validatedBody.active !== undefined ? validatedBody.active : true,
    }
    if (validatedBody.email !== undefined && validatedBody.email !== null && validatedBody.email !== '') {
      body.email = validatedBody.email
    }
    if (validatedBody.role !== undefined && validatedBody.role !== null && validatedBody.role !== '') {
      body.role = validatedBody.role
    }
    if (validatedBody.phone !== undefined && validatedBody.phone !== null && validatedBody.phone !== '') {
      body.phone = validatedBody.phone
    }
    // notes 필드는 데이터베이스에 컬럼이 없으므로 제외
    // if (validatedBody.notes !== undefined && validatedBody.notes !== null && validatedBody.notes !== '') {
    //   body.notes = validatedBody.notes
    // }
    const data = await repository.createStaff(body)
    return createSuccessResponse(data, 201)
  } catch (error) {
    // 에러를 다시 throw하여 withAuth의 에러 핸들러가 처리하도록 함
    throw error
  }
})


