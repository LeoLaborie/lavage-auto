import { NextResponse } from 'next/server'
import { withWasherGuard } from '@/lib/auth/washerGuard'
import { prisma } from '@/lib/prisma'

export const PATCH = withWasherGuard(async (req, user, profile) => {
    try {
        let body
        try {
            body = await req.json()
        } catch (e) {
            return NextResponse.json({ error: 'Invalid or missing JSON payload' }, { status: 400 })
        }
        const { isAvailable } = body

        if (typeof isAvailable !== 'boolean') {
            return NextResponse.json({ error: 'Invalid payload, expected boolean isAvailable' }, { status: 400 })
        }

        const updatedProfile = await prisma.profile.update({
            where: { id: profile.id },
            data: { isAvailable }
        })

        return NextResponse.json({ success: true, data: { isAvailable: updatedProfile.isAvailable } })
    } catch (error) {
        console.error('Error updating availability:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
})
