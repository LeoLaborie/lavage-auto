import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import type { User } from '@prisma/client'

type AdminAuthSuccess = { ok: true; authUser: SupabaseUser; dbUser: User }
type AdminAuthFailure = { ok: false; response: NextResponse }
type AdminAuthResult = AdminAuthSuccess | AdminAuthFailure

/**
 * Shared auth check for Admin routes.
 * Use this in dynamic routes where withAdminGuard cannot forward { params }.
 * Distinguishes 401 (no session / no DB record) from 403 (wrong role).
 */
export async function checkAdminAuth(req: Request): Promise<AdminAuthResult> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { ok: false, response: NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 }) }
    }

    const dbUser = await prisma.user.findUnique({ where: { authId: user.id } })

    // No DB record = effectively unauthenticated in this system → 401, not 403
    if (!dbUser) {
        return { ok: false, response: NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 }) }
    }

    if (dbUser.role !== 'ADMIN') {
        return { ok: false, response: NextResponse.json({ success: false, error: 'Forbidden: ADMIN role required' }, { status: 403 }) }
    }

    return { ok: true, authUser: user, dbUser }
}

/**
 * Reusable HOC guard for Admin API routes (non-dynamic routes).
 * For dynamic routes with { params }, use checkAdminAuth() directly.
 */
export function withAdminGuard(
    handler: (req: Request, authUser: SupabaseUser, dbUser: User) => Promise<NextResponse>
) {
    return async (req: Request) => {
        try {
            const auth = await checkAdminAuth(req)
            if (!auth.ok) return auth.response
            return await handler(req, auth.authUser, auth.dbUser)
        } catch (error) {
            console.error('API Error in Admin Guard:', error)
            return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
        }
    }
}
