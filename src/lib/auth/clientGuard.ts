import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

/**
 * Reusable guard for Client API routes.
 * Ensures the user is authenticated and has role CLIENT.
 * Follows the same pattern as washerGuard.ts.
 */
export function withClientGuard(
    handler: (req: Request, user: any, dbUser: any) => Promise<NextResponse>
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

            if (!dbUser || dbUser.role !== 'CLIENT') {
                return NextResponse.json({ success: false, error: 'Forbidden: CLIENT role required' }, { status: 403 })
            }

            return await handler(req, user, dbUser)

        } catch (error) {
            console.error('API Error in Client Guard:', error)
            return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
        }
    }
}
