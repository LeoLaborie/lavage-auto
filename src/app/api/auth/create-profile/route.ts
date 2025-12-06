import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const body = await request.json()
        const { role, email, name, avatarUrl } = body

        if (!role || !['CLIENT', 'WASHER'].includes(role)) {
            return NextResponse.json(
                { error: 'Invalid role' },
                { status: 400 }
            )
        }

        // Check if profile already exists to prevent duplicates
        const existingCustomer = await prisma.customer.findUnique({
            where: { email: user.email! }
        })

        const existingWasher = await prisma.washer.findUnique({
            where: { email: user.email! }
        })

        if (existingCustomer || existingWasher) {
            return NextResponse.json(
                { error: 'Profile already exists' },
                { status: 409 }
            )
        }

        let profile

        if (role === 'CLIENT') {
            profile = await prisma.customer.create({
                data: {
                    email: user.email!,
                    name: name || user.email!.split('@')[0],
                    supabaseUserId: user.id,
                    profilePicture: avatarUrl,
                    emailVerified: true // Google auth implies verified email
                }
            })
        } else {
            profile = await prisma.washer.create({
                data: {
                    email: user.email!,
                    name: name || user.email!.split('@')[0],
                    phone: '', // Phone is required in schema but not available from Google, setting empty for now
                    profilePicture: avatarUrl,
                    status: 'AVAILABLE'
                }
            })
        }

        return NextResponse.json({ success: true, profile })

    } catch (error) {
        console.error('Error creating profile:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
