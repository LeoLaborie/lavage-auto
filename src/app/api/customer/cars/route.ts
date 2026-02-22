// TODO: Removed in new schema - Cars belong to bookings directly now.
// This route will be redesigned in Epic 2 if vehicle management is needed.
import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json(
    { success: false, error: 'Not implemented yet.' },
    { status: 501 }
  )
}