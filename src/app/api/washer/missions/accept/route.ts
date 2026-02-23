import { NextResponse } from 'next/server'
import { withWasherGuard } from '@/lib/auth/washerGuard'

export const POST = withWasherGuard(async (req, user, profile) => {
    return NextResponse.json(
        { success: false, error: 'Not implemented yet. See Epic 4 / Story 4.2.' },
        { status: 501 }
    )
})
