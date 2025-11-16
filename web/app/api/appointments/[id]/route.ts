import { NextRequest } from 'next/server'
import { withAuth } from '@/app/lib/api/middleware'
import { parseBody, createSuccessResponse } from '@/app/lib/api/handlers'
import { AppointmentsRepository } from '@/app/lib/repositories/appointments.repository'
import type { AppointmentUpdateInput } from '@/types/entities'

export const GET = withAuth(async (_req: NextRequest, { userId, params }) => {
  if (!params?.id || typeof params.id !== "string") {
    return createSuccessResponse({ ok: false, error: "Missing or invalid appointment ID" })
  }
  const repository = new AppointmentsRepository(userId)
  const data = await repository.findById(params.id)
  return createSuccessResponse(data)
})

export const PUT = withAuth(async (req: NextRequest, { userId, params }) => {
  if (!params?.id || typeof params.id !== "string") {
    return createSuccessResponse({ ok: false, error: "Missing or invalid appointment ID" })
  }
  const body = await parseBody<AppointmentUpdateInput>(req)
  const repository = new AppointmentsRepository(userId)
  const data = await repository.updateAppointment(params.id, body)
  return createSuccessResponse(data)
})

export const DELETE = withAuth(async (_req: NextRequest, { userId, params }) => {
  if (!params?.id || typeof params.id !== "string") {
    return createSuccessResponse({ ok: false, error: "Missing or invalid appointment ID" })
  }
  const repository = new AppointmentsRepository(userId)
  await repository.delete(params.id)
  return createSuccessResponse({ ok: true })
})
