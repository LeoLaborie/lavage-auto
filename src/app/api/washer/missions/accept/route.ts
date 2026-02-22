// TODO: Story 4.2 - Rewrite for new schema (Washer mission accept)
import { NextResponse } from 'next/server'

export async function POST() {
    return NextResponse.json(
        { success: false, error: 'Not implemented yet. See Epic 4 / Story 4.2.' },
        { status: 501 }
    )
}
