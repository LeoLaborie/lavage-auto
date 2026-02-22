import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const dbUser = await prisma.user.findUnique({
            where: { authId: user.id },
            select: { role: true }
        })

        if (!dbUser) {
            return NextResponse.json(
                { success: false, error: 'Profile not found' },
                { status: 404 }
            )
        }

        return NextResponse.json({ success: true, data: { role: dbUser.role } })

    } catch (error) {
        console.error('Error fetching role:', error)
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        )
    }
}
