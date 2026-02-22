import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { UserRole, ProfileStatus, Prisma } from '@prisma/client'

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
        const { role, name, siret, companyName } = body

        if (!role || !['CLIENT', 'LAVEUR'].includes(role)) {
            return NextResponse.json(
                { success: false, error: 'Invalid role. Must be CLIENT or LAVEUR.' },
                { status: 400 }
            )
        }

        // SIRET is MANDATORY for Laveurs
        if (role === 'LAVEUR') {
            if (!siret) {
                return NextResponse.json(
                    { success: false, error: 'Le numéro SIRET est obligatoire pour les laveurs.' },
                    { status: 400 }
                )
            }

            const siretClean = siret.replace(/\s/g, '')
            if (!/^\d{14}$/.test(siretClean)) {
                return NextResponse.json(
                    { success: false, error: 'Format SIRET invalide. Le SIRET doit contenir exactement 14 chiffres.' },
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

        // Build profile data
        const sanitizedName = (name || user.email.split('@')[0]).trim().slice(0, 100)
        const profileData: Prisma.ProfileCreateWithoutUserInput = {
            firstName: sanitizedName,
            status: profileStatus,
        }

        if (role === 'LAVEUR' && siret) {
            profileData.siret = siret.replace(/\s/g, '')
            if (companyName?.trim()) {
                profileData.companyName = companyName.trim()
            }
        }

        // Create User + Profile in a transaction
        const newUser = await prisma.user.create({
            data: {
                authId: user.id,
                email: user.email,
                role: role as UserRole,
                profile: {
                    create: profileData
                }
            },
            include: { profile: true }
        })

        return NextResponse.json({ success: true, data: newUser })

    } catch (error) {
        // Handle Prisma unique constraint violations
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2002') {
                const target = (error.meta?.target as string[]) || []
                if (target.includes('siret')) {
                    return NextResponse.json(
                        { success: false, error: 'Ce numéro SIRET est déjà associé à un compte existant.' },
                        { status: 409 }
                    )
                }
                if (target.includes('auth_id')) {
                    return NextResponse.json(
                        { success: false, error: 'Un profil existe déjà pour cet utilisateur.' },
                        { status: 409 }
                    )
                }
                if (target.includes('email')) {
                    return NextResponse.json(
                        { success: false, error: 'Cet email est déjà associé à un compte.' },
                        { status: 409 }
                    )
                }
                return NextResponse.json(
                    { success: false, error: 'Un enregistrement avec ces informations existe déjà.' },
                    { status: 409 }
                )
            }
        }

        console.error('Error creating profile:', error)
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        )
    }
}
