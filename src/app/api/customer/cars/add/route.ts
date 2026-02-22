// TODO: Removed in new schema - Cars model simplified.
import { NextResponse } from 'next/server'

export async function POST() {
    return NextResponse.json(
        { success: false, error: 'Not implemented yet.' },
        { status: 501 }
    )
}
