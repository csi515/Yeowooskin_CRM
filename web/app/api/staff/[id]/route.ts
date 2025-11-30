import { NextRequest } from 'next/server'
import { withAuth } from '@/app/lib/api/middleware'
import { parseAndValidateBody, createSuccessResponse } from '@/app/lib/api/handlers'
import { StaffRepository } from '@/app/lib/repositories/staff.repository'
import { staffUpdateSchema } from '@/app/lib/api/schemas'
import { NotFoundError } from '@/app/lib/api/errors'

export const GET = withAuth(async (_req: NextRequest, { userId, supabase, params }) => {
  const id = params?.['id']
  if (!id || typeof id !== "string") {
    throw new NotFoundError("Missing or invalid staff ID")
  }
  const repository = new StaffRepository(userId, supabase)
  const data = await repository.findById(id)
  if (!data) {
    throw new NotFoundError("Staff not found")
  }
  return createSuccessResponse(data)
})

export const PUT = withAuth(async (req: NextRequest, { userId, supabase, params }) => {
  const id = params?.['id']
  if (!id || typeof id !== "string") {
    throw new NotFoundError("Missing or invalid staff ID")
  }
  const validatedBody = await parseAndValidateBody(req, staffUpdateSchema)
  const repository = new StaffRepository(userId, supabase)
  // exactOptionalPropertyTypes를 위한 타입 변환
  const body: Parameters<typeof repository.updateStaff>[1] = {}
  if (validatedBody.name !== undefined) {
    body.name = validatedBody.name
  }
  if (validatedBody.email !== undefined) {
    body.email = validatedBody.email
  }
  if (validatedBody.role !== undefined) {
    body.role = validatedBody.role
  }
  if (validatedBody.phone !== undefined) {
    body.phone = validatedBody.phone
  }
  // notes 필드는 데이터베이스에 컬럼이 없으므로 제외
  // if (validatedBody.notes !== undefined) {
  //   body.notes = validatedBody.notes
  // }
  if (validatedBody.active !== undefined) {
    body.active = validatedBody.active
  }
  const data = await repository.updateStaff(id, body)
  return createSuccessResponse(data)
})

export const DELETE = withAuth(async (_req: NextRequest, { userId, supabase, params }) => {
  const id = params?.['id']
  if (!id || typeof id !== "string") {
    throw new NotFoundError("Missing or invalid staff ID")
  }
  const repository = new StaffRepository(userId, supabase)
  await repository.delete(id)
  return createSuccessResponse({ ok: true })
})


