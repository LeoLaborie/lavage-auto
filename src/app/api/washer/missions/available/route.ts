// TODO: Story 4.1 - Rewrite for new schema (Washer available missions)
import { NextResponse } from 'next/server'

export async function GET() {
    return NextResponse.json(
        { success: false, error: 'Not implemented yet. See Epic 4 / Story 4.1.' },
        { status: 501 }
    )
}
