import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkAdminAuth } from '@/lib/auth/adminGuard'

export const dynamic = 'force-dynamic'

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const auth = await checkAdminAuth(req)
        if (!auth.ok) return auth.response

        const { id } = await params

        if (!id || typeof id !== 'string' || id.trim().length < 5) {
            return NextResponse.json({ success: false, error: 'Identifiant invalide' }, { status: 400 })
        }

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

        if (profile.status === 'REJECTED') {
            return NextResponse.json({ success: false, error: 'Profil déjà rejeté' }, { status: 409 })
        }

        if (profile.status === 'VALIDATED') {
            console.warn('[admin/reject] Revoking VALIDATED profile:', id)
        }

        await prisma.profile.update({
            where: { userId: id },
            data: { status: 'REJECTED' },
        })

        return NextResponse.json({ success: true, data: { userId: id, profileStatus: 'REJECTED' } })

    } catch (error) {
        console.error('[admin/reject] Error:', error)
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
    }
}
