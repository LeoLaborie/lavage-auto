import Link from 'next/link'
import { AppleEmoji } from '@/components/AppleEmoji'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'

export const dynamic = 'force-dynamic'

/**
 * Stripe Connect onboarding return URL.
 * The user lands here after Stripe finishes (or abandons) onboarding.
 * We fetch the live account state and sync the DB flag, then render an honest status.
 */
export default async function StripeCallbackPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    let ready = false
    let hasAccount = false

    if (user) {
        const dbUser = await prisma.user.findUnique({
            where: { authId: user.id },
            include: { profile: true },
        })
        const accountId = dbUser?.profile?.stripeAccountId
        if (accountId) {
            hasAccount = true
            try {
                const account = await stripe.accounts.retrieve(accountId)
                ready = Boolean(
                    account.charges_enabled &&
                    account.payouts_enabled &&
                    account.details_submitted
                )
                await prisma.profile.update({
                    where: { userId: dbUser!.id },
                    data: { stripeAccountReady: ready },
                })
            } catch (err) {
                console.error('[stripe-callback] retrieve failed:', err)
            }
        }
    }

    const title = ready ? 'Configuration terminée !' : 'Onboarding non terminé'
    const message = ready
        ? 'Votre compte Stripe est activé. Vous pouvez maintenant accepter des missions et recevoir vos virements.'
        : hasAccount
            ? 'Stripe n\'a pas encore activé votre compte. Il vous manque peut-être des informations. Revenez au tableau de bord pour reprendre l\'onboarding.'
            : 'Aucun compte Stripe trouvé. Revenez au tableau de bord pour démarrer la configuration.'

    const badgeClass = ready ? 'bg-green-100' : 'bg-amber-100'
    const emojiName = ready ? 'white_check_mark' : 'warning'

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
                <div className={`${badgeClass} w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6`}>
                    <AppleEmoji name={emojiName} className="w-10 h-10" />
                </div>

                <h1 className="text-2xl font-bold text-gray-900 mb-2">{title}</h1>
                <p className="text-gray-600 mb-8">{message}</p>

                <Link
                    href="/dashboard"
                    className="block w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-colors"
                >
                    Retour au tableau de bord
                </Link>
            </div>
        </div>
    )
}
