'use server'

import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { createConnectAccount, createAccountLink, stripe } from '@/lib/stripe'

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

        // Verify the saved account still exists on our Stripe platform. Stale IDs can remain
        // if the Stripe secret key was rotated or the account was deleted — clear and recreate.
        if (stripeAccountId) {
            try {
                await stripe.accounts.retrieve(stripeAccountId)
            } catch (err: any) {
                console.warn(`[stripe-onboarding] Stale stripeAccountId ${stripeAccountId}: ${err.message}. Resetting.`)
                stripeAccountId = undefined
                await prisma.profile.update({
                    where: { userId: dbUser.id },
                    data: { stripeAccountId: null, stripeAccountReady: false },
                })
            }
        }

        if (!stripeAccountId) {
            const account = await createConnectAccount(dbUser.email, dbUser.id)
            stripeAccountId = account.id

            await prisma.profile.update({
                where: { userId: dbUser.id },
                data: { stripeAccountId },
            })
        }

        const accountLink = await createAccountLink(stripeAccountId)

        return { success: true, data: { url: accountLink.url } }
    } catch (error: any) {
        console.error('Error in startStripeOnboarding:', error)
        return { success: false, error: error.message || 'Erreur lors du démarrage de l\'onboarding Stripe' }
    }
}
