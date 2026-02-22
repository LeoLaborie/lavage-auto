// TODO: Story 2.2 - Rewrite for new schema (Time slot validation)
import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json(
    { success: false, error: 'Not implemented yet. See Epic 2 / Story 2.2.' },
    { status: 501 }
  )
}