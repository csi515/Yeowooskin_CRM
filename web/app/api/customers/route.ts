import { NextRequest } from 'next/server'
import { withAuth } from '@/app/lib/api/middleware'
import { parseQueryParams, parseAndValidateBody, createSuccessResponse } from '@/app/lib/api/handlers'
import { CustomersRepository } from '@/app/lib/repositories/customers.repository'
import { customerCreateSchema } from '@/app/lib/api/schemas'

export const GET = withAuth(async (req: NextRequest, { userId }) => {
  const params = parseQueryParams(req)
  const repository = new CustomersRepository(userId)
  const data = await repository.findAll(params)
  return createSuccessResponse(data)
})

export const POST = withAuth(async (req: NextRequest, { userId }) => {
  const validatedBody = await parseAndValidateBody(req, customerCreateSchema)
  const repository = new CustomersRepository(userId)
  // exactOptionalPropertyTypes를 위한 타입 변환
  const body: Parameters<typeof repository.createCustomer>[0] = {
    name: validatedBody.name,
  }
  if (validatedBody.email !== undefined) {
    body.email = validatedBody.email
  }
  if (validatedBody.address !== undefined) {
    body.address = validatedBody.address
  }
  if (validatedBody.phone !== undefined) {
    body.phone = validatedBody.phone
  }
  if (validatedBody.features !== undefined) {
    body.features = validatedBody.features
  }
  // 건강 정보 필드 추가
  if (validatedBody.health_allergies !== undefined) {
    body.health_allergies = validatedBody.health_allergies
  }
  if (validatedBody.health_medications !== undefined) {
    body.health_medications = validatedBody.health_medications
  }
  if (validatedBody.health_skin_conditions !== undefined) {
    body.health_skin_conditions = validatedBody.health_skin_conditions
  }
  if (validatedBody.health_pregnant !== undefined) {
    body.health_pregnant = validatedBody.health_pregnant
  }
  if (validatedBody.health_breastfeeding !== undefined) {
    body.health_breastfeeding = validatedBody.health_breastfeeding
  }
  if (validatedBody.health_notes !== undefined) {
    body.health_notes = validatedBody.health_notes
  }
  if (validatedBody.skin_type !== undefined) {
    body.skin_type = validatedBody.skin_type
  }
  if (validatedBody.skin_concerns !== undefined) {
    body.skin_concerns = validatedBody.skin_concerns
  }
  if (validatedBody.birthdate !== undefined) {
    body.birthdate = validatedBody.birthdate
  }
  if (validatedBody.recommended_visit_interval_days !== undefined) {
    body.recommended_visit_interval_days = validatedBody.recommended_visit_interval_days
  }
  const data = await repository.createCustomer(body)
  return createSuccessResponse(data, 201)
})
