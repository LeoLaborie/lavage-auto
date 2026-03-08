import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import type { User } from '@prisma/client'

/**
 * Reusable guard for Admin API routes.
 * Distinguishes 401 (no session / no DB record) from 403 (wrong role).
 * A Supabase-authenticated user with no DB record is treated as 401, not 403.
 */
export function withAdminGuard(
    handler: (req: Request, authUser: SupabaseUser, dbUser: User) => Promise<NextResponse>
) {
    return async (req: Request) => {
        try {
            const supabase = await createClient()
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
            }

            const dbUser = await prisma.user.findUnique({
                where: { authId: user.id }
            })

            // No DB record = effectively unauthenticated in this system → 401, not 403
            if (!dbUser) {
                return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
            }

            if (dbUser.role !== 'ADMIN') {
                return NextResponse.json({ success: false, error: 'Forbidden: ADMIN role required' }, { status: 403 })
            }

            return await handler(req, user, dbUser)

        } catch (error) {
            console.error('API Error in Admin Guard:', error)
            return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
        }
    }
}
