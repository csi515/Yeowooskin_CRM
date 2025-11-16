import { NextRequest } from 'next/server'
import { withAuth } from '@/app/lib/api/middleware'
import { parseQueryParams, parseBody, createSuccessResponse } from '@/app/lib/api/handlers'
import { AppointmentsRepository } from '@/app/lib/repositories/appointments.repository'
import type { AppointmentCreateInput } from '@/types/entities'

export const GET = withAuth(async (req: NextRequest, { userId }) => {
  const params = parseQueryParams(req)
  const repository = new AppointmentsRepository(userId)
  const data = await repository.findAll({
    ...params,
    from: params.from,
    to: params.to,
  })
  return createSuccessResponse(data)
})

export const POST = withAuth(async (req: NextRequest, { userId }) => {
  const body = await parseBody<AppointmentCreateInput>(req)
  const repository = new AppointmentsRepository(userId)
  const data = await repository.createAppointment(body)
  return createSuccessResponse(data, 201)
})
