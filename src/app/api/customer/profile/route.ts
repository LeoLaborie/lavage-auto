// TODO: Story 1.2 / 1.3 - Rewrite for new schema (Customer profile)
import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json(
    { success: false, error: 'Not implemented yet. See Epic 1 / Story 1.2.' },
    { status: 501 }
  )
}

export async function PATCH() {
  return NextResponse.json(
    { success: false, error: 'Not implemented yet. See Epic 1 / Story 1.2.' },
    { status: 501 }
  )
}