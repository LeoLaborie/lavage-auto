// TODO: Story 2.3 - Rewrite for new schema (Booking creation)
import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json(
    { success: false, error: 'Not implemented yet. See Epic 2 / Story 2.3.' },
    { status: 501 }
  )
}