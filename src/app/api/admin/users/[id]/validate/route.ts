import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }

        const dbAdmin = await prisma.user.findUnique({ where: { authId: user.id } })

        if (!dbAdmin) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }

        if (dbAdmin.role !== 'ADMIN') {
            return NextResponse.json({ success: false, error: 'Forbidden: ADMIN role required' }, { status: 403 })
        }

        const { id } = await params

        const targetUser = await prisma.user.findUnique({ where: { id } })
        if (!targetUser) {
            return NextResponse.json({ success: false, error: 'Utilisateur introuvable' }, { status: 404 })
        }

        if (targetUser.role !== 'LAVEUR') {
            return NextResponse.json(
                { success: false, error: 'Seuls les profils Laveur peuvent être modifiés' },
                { status: 400 }
            )
        }

        const profile = await prisma.profile.findUnique({ where: { userId: id } })
        if (!profile) {
            return NextResponse.json({ success: false, error: 'Profil introuvable' }, { status: 404 })
        }

        if (profile.status === 'VALIDATED') {
            return NextResponse.json({ success: false, error: 'Profil déjà validé' }, { status: 409 })
        }

        if (profile.status === 'REJECTED') {
            console.warn('[admin/validate] Re-validating previously REJECTED profile:', id)
        }

        await prisma.profile.update({
            where: { userId: id },
            data: { status: 'VALIDATED' },
        })

        return NextResponse.json({ success: true, data: { userId: id, profileStatus: 'VALIDATED' } })

    } catch (error) {
        console.error('[admin/validate] Error:', error)
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
    }
}
