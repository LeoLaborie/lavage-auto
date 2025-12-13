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
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        // Check if user is a customer
        const customer = await prisma.customer.findUnique({
            where: { email: user.email! }
        })

        if (customer) {
            return NextResponse.json({ role: 'CLIENT' })
        }

        // Check if user is a washer
        const washer = await prisma.washer.findUnique({
            where: { email: user.email! }
        })

        if (washer) {
            return NextResponse.json({ role: 'WASHER' })
        }

        return NextResponse.json(
            { error: 'Profile not found' },
            { status: 404 }
        )

    } catch (error) {
        console.error('Error fetching role:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
