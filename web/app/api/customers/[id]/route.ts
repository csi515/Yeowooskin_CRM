import { NextRequest } from 'next/server'
import { requireAuthenticated } from '@/app/lib/api/roleGuard'
import { parseAndValidateBody, createSuccessResponse, createErrorResponse } from '@/app/lib/api/handlers'
import { CustomersRepository } from '@/app/lib/repositories/customers.repository'
import { customerUpdateSchema } from '@/app/lib/api/schemas'
import { NotFoundError } from '@/app/lib/api/errors'

export const GET = async (req: NextRequest, { params }: { params: { id: string } }) => {
  try {
    const userProfile = await requireAuthenticated(req)
    const id = params?.['id']
    if (!id || typeof id !== "string") {
      throw new NotFoundError("Missing or invalid customer ID")
    }
    const repository = new CustomersRepository(userProfile.id)
    const data = await repository.findById(id)
    if (!data) {
      throw new NotFoundError("Customer not found")
    }
    return createSuccessResponse(data)
  } catch (error) {
    return createErrorResponse(error)
  }
}

export const PUT = async (req: NextRequest, { params }: { params: { id: string } }) => {
  try {
    const userProfile = await requireAuthenticated(req)
    const id = params?.['id']
    if (!id || typeof id !== "string") {
      throw new NotFoundError("Missing or invalid customer ID")
    }
    const validatedBody = await parseAndValidateBody(req, customerUpdateSchema)
    const repository = new CustomersRepository(userProfile.id)
    // exactOptionalPropertyTypes를 위한 타입 변환
    const body: Parameters<typeof repository.updateCustomer>[1] = {}
    if (validatedBody.name !== undefined) {
      body.name = validatedBody.name
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
    const data = await repository.updateCustomer(id, body)
    return createSuccessResponse(data)
  } catch (error) {
    return createErrorResponse(error)
  }
}

export const DELETE = async (req: NextRequest, { params }: { params: { id: string } }) => {
  try {
    const userProfile = await requireAuthenticated(req)
    const id = params?.['id']
    if (!id || typeof id !== "string") {
      throw new NotFoundError("Missing or invalid customer ID")
    }
    const repository = new CustomersRepository(userProfile.id)
    await repository.delete(id)
    return createSuccessResponse({ ok: true })
  } catch (error) {
    return createErrorResponse(error)
  }
}
