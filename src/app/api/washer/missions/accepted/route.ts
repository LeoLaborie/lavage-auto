// TODO: Story 4.3 - Rewrite for new schema (Washer accepted missions)
import { NextResponse } from 'next/server'

export async function GET() {
    return NextResponse.json(
        { success: false, error: 'Not implemented yet. See Epic 4 / Story 4.3.' },
        { status: 501 }
    )
}
