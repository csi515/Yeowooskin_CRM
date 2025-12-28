import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getServerUser } from '@/lib/supabase/server'
import { z } from 'zod'
import { addWeeks, addDays, format, parseISO, startOfWeek } from 'date-fns'

const scheduleSchema = z.object({
    staff_id: z.string().uuid(),
    start_date: z.string(), // YYYY-MM-DD (Expected to be a Monday ideally, but logic handles it)
    repeat_weeks: z.number().min(1).max(12),
    schedule: z.array(z.object({
        day_of_week: z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']),
        is_holiday: z.boolean(),
        start_time: z.string(),
        end_time: z.string()
    }))
})

// Monday = 1, Sunday = 0 in date-fns getDay(), BUT
// We map day_of_week string to offset from Monday (0-6)
const DAY_OFFSET: Record<string, number> = {
    monday: 0,
    tuesday: 1,
    wednesday: 2,
    thursday: 3,
    friday: 4,
    saturday: 5,
    sunday: 6
}

export async function POST(req: NextRequest) {
    try {
        const userResult = await getServerUser()
        if (!userResult.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        const user = userResult.user

        const json = await req.json()
        const body = scheduleSchema.parse(json)
        const supabase = await createSupabaseServerClient()

        const startDate = parseISO(body.start_date)
        const recordsToInsert = []

        // Calculate the Monday of the start week to align offsets correctly
        // Assuming user picks a Monday, but if not, align to that week's Monday
        const baseMonday = startOfWeek(startDate, { weekStartsOn: 1 })

        for (let week = 0; week < body.repeat_weeks; week++) {
            const weekBaseDate = addWeeks(baseMonday, week)

            for (const daySchedule of body.schedule) {
                if (daySchedule.is_holiday) continue

                const offset = DAY_OFFSET[daySchedule.day_of_week] ?? 0
                const targetDate = addDays(weekBaseDate, offset)
                const dateStr = format(targetDate, 'yyyy-MM-dd')

                // Construct full timestamp
                const startTime = `${dateStr}T${daySchedule.start_time}:00`
                const endTime = `${dateStr}T${daySchedule.end_time}:00`

                recordsToInsert.push({
                    owner_id: user.id,
                    staff_id: body.staff_id,
                    type: 'scheduled',
                    start_time: startTime,
                    end_time: endTime,
                    status: 'normal'
                })
            }
        }

        if (recordsToInsert.length > 0) {
            // Delete existing schedules for the covered period to avoid duplication?
            // Or just insert? Usually overwrite is better UX or upsert.
            // For now, let's just insert. User can delete manually if needed.
            // Ideally: Delete conflicting ranges.

            // Optimization: Delete all 'scheduled' type records for this staff in the range first
            const firstDate = recordsToInsert[0]?.start_time
            const lastDate = recordsToInsert[recordsToInsert.length - 1]?.end_time

            if (!firstDate || !lastDate) {
                throw new Error('Invalid date range')
            }

            await supabase
                .from('staff_attendance')
                .delete()
                .eq('owner_id', user.id)
                .eq('staff_id', body.staff_id)
                .eq('type', 'scheduled')
                .gte('start_time', firstDate)
                .lte('end_time', lastDate)

            const { error: insertError } = await supabase
                .from('staff_attendance')
                .insert(recordsToInsert)

            if (insertError) throw insertError
        }

        return NextResponse.json({ success: true, count: recordsToInsert.length })

    } catch (error) {
        console.error('Batch schedule error:', error)
        return NextResponse.json(
            { error: error instanceof z.ZodError ? 'Validation Error' : 'Internal Server Error' },
            { status: 500 }
        )
    }
}
