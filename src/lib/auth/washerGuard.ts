import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '@prisma/client'

/**
 * Reusable guard for Washer (Laveur) API routes.
 * Ensures the user is authenticated, has a profile, and the profile is VALIDATED.
 * Includes try/catch for robust error handling.
 */
export function withWasherGuard(
    handler: (req: Request, user: User, profile: Profile) => Promise<NextResponse>
) {
    return async (req: Request) => {
        try {
            const supabase = await createClient()
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
            }

            // Profile.userId references User.id (cuid), not the Supabase Auth UUID.
            // We must resolve via the User relation (authId) to find the correct profile.
            const profile = await prisma.profile.findFirst({
                where: { user: { authId: user.id } }
            })

            // Fail-closed approach: ONLY allow VALIDATED
            if (!profile || profile.status !== 'VALIDATED') {
                return NextResponse.json({ success: false, error: 'Profile not validated or missing' }, { status: 403 })
            }

            // Execute the actual route handler
            return await handler(req, user, profile)

        } catch (error) {
            console.error('API Error in Washer Guard:', error)
            return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
        }
    }
}
