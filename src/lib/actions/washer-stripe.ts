'use server'

import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { createConnectAccount, createAccountLink } from '@/lib/stripe'

export async function startStripeOnboarding() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return { success: false, error: 'Non authentifié' }
        }

        // Fetch DB user with profile
        const dbUser = await prisma.user.findUnique({
            where: { authId: user.id },
            include: { profile: true }
        })

        if (!dbUser) {
            return { success: false, error: 'Utilisateur non trouvé' }
        }

        if (dbUser.role !== 'LAVEUR') {
            return { success: false, error: 'Accès restreint aux laveurs' }
        }

        let stripeAccountId = dbUser.profile?.stripeAccountId

        if (!stripeAccountId) {
            // Create new Stripe Connect account
            const account = await createConnectAccount(dbUser.email, dbUser.id)
            stripeAccountId = account.id

            // Save to profile
            await prisma.profile.update({
                where: { userId: dbUser.id },
                data: { stripeAccountId: stripeAccountId }
            })
        }

        // Create onboarding link
        const accountLink = await createAccountLink(stripeAccountId)

        return { success: true, data: { url: accountLink.url } }
    } catch (error: any) {
        console.error('Error in startStripeOnboarding:', error)
        return { success: false, error: error.message || 'Erreur lors du démarrage de l\'onboarding Stripe' }
    }
}
