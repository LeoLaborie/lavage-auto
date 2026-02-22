import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { UserRole, ProfileStatus } from '@prisma/client'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            )
        }

        // Validate email exists (could be null for phone-based auth)
        if (!user.email) {
            return NextResponse.json(
                { success: false, error: 'Email is required for registration.' },
                { status: 400 }
            )
        }

        const body = await request.json()
        const { role, name, siret } = body

        if (!role || !['CLIENT', 'LAVEUR'].includes(role)) {
            return NextResponse.json(
                { success: false, error: 'Invalid role. Must be CLIENT or LAVEUR.' },
                { status: 400 }
            )
        }

        // Validate SIRET format for Laveurs (must be exactly 14 digits)
        if (role === 'LAVEUR' && siret) {
            const siretClean = siret.replace(/\s/g, '')
            if (!/^\d{14}$/.test(siretClean)) {
                return NextResponse.json(
                    { success: false, error: 'Invalid SIRET format. Must be exactly 14 digits.' },
                    { status: 400 }
                )
            }
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { authId: user.id }
        })

        if (existingUser) {
            return NextResponse.json(
                { success: false, error: 'Profile already exists' },
                { status: 409 }
            )
        }

        // Determine profile status based on role
        const profileStatus: ProfileStatus = role === 'LAVEUR'
            ? ProfileStatus.VALIDATION_PENDING
            : ProfileStatus.VALIDATED

        // Create User + Profile in a transaction
        const newUser = await prisma.user.create({
            data: {
                authId: user.id,
                email: user.email,
                role: role as UserRole,
                profile: {
                    create: {
                        firstName: name || user.email.split('@')[0],
                        status: profileStatus,
                        ...(role === 'LAVEUR' && siret
                            ? { siret: siret.replace(/\s/g, '') }
                            : {}),
                    }
                }
            },
            include: { profile: true }
        })

        return NextResponse.json({ success: true, data: newUser })

    } catch (error) {
        console.error('Error creating profile:', error)
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        )
    }
}
