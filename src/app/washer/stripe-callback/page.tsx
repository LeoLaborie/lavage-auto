import Link from 'next/link'
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

    const eyebrow = ready ? 'Onboarding · Terminé' : 'Onboarding · En attente'
    const title = ready ? 'Configuration terminée.' : 'Onboarding non terminé.'
    const message = ready
        ? 'Votre compte Stripe est activé. Vous pouvez maintenant accepter des missions et recevoir vos virements.'
        : hasAccount
            ? 'Stripe n\'a pas encore activé votre compte. Il manque peut-être des informations à compléter. Reprenez l\'onboarding depuis votre tableau de bord.'
            : 'Aucun compte Stripe trouvé. Démarrez la configuration depuis votre tableau de bord.'

    const ctaLabel = ready ? 'Aller au tableau de bord' : 'Reprendre l\'onboarding'

    return (
        <main className="min-h-screen bg-blue-wash">
            <div className="mx-auto flex min-h-screen w-full max-w-cin items-center justify-center px-5 py-16 md:px-12 md:py-[120px]">
                <div className="w-full max-w-md rounded-[20px] bg-white p-8 text-center shadow-cin-card md:p-10">
                    <div
                        className={`mx-auto mb-7 flex h-16 w-16 items-center justify-center rounded-full ${
                            ready ? 'bg-ink text-white' : 'bg-blue-wash text-blue'
                        }`}
                        aria-hidden="true"
                    >
                        {ready ? (
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="h-7 w-7"
                            >
                                <path d="M5 12.5l5 5L20 7" />
                            </svg>
                        ) : (
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="h-7 w-7"
                            >
                                <circle cx="12" cy="12" r="9" />
                                <line x1="12" y1="8" x2="12" y2="13" />
                                <line x1="12" y1="17" x2="12" y2="17" />
                            </svg>
                        )}
                    </div>

                    <p className="mb-3 font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-blue md:text-xs">
                        {eyebrow}
                    </p>

                    <h1 className="mb-4 font-display text-[28px] font-extrabold leading-[1.05] tracking-[-0.03em] text-ink md:text-[34px]">
                        {title}
                    </h1>

                    <p className="mb-8 text-[15px] leading-relaxed text-ink2 md:text-[17px]">
                        {message}
                    </p>

                    <Link
                        href="/dashboard"
                        className="inline-flex w-full items-center justify-center rounded-xl bg-ink px-6 py-4 font-cinsans text-[15px] font-semibold text-white shadow-cin-button transition-transform hover:-translate-y-0.5"
                    >
                        {ctaLabel}
                    </Link>
                </div>
            </div>
        </main>
    )
}
