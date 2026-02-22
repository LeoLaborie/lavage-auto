// TODO: Story 2.4 - Rewrite for new schema (Customer booking cancellation)
import { NextResponse } from 'next/server'

export async function POST() {
    return NextResponse.json(
        { success: false, error: 'Not implemented yet. See Epic 2 / Story 2.4.' },
        { status: 501 }
    )
}
