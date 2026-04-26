import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import CommissionSettingsForm from '@/components/features/admin/CommissionSettingsForm'
import { DEFAULT_COMMISSION_RATE } from '@/lib/constants/commission'

export const dynamic = 'force-dynamic'

export const metadata = {
    title: 'Paramètres plateforme',
}

export default async function AdminSettingsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const dbUser = await prisma.user.findUnique({ where: { authId: user.id } })
    if (!dbUser || dbUser.role !== 'ADMIN') redirect('/')

    const settings =
        (await prisma.platformSettings.findFirst()) ??
        (await prisma.platformSettings.create({ data: { commissionRate: DEFAULT_COMMISSION_RATE } }))

    return (
        <div className="min-h-screen bg-white">
            <main className="mx-auto max-w-cin px-5 py-16 md:px-12 md:py-[120px]">
                <div className="mb-10 max-w-2xl md:mb-14">
                    <div className="mb-5 inline-block rounded-md bg-blue-wash px-3 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.05em] text-blue md:text-xs">
                        Paramètres
                    </div>
                    <h1 className="font-display text-[44px] font-extrabold leading-[0.95] tracking-[-0.04em] text-ink md:text-[64px]">
                        Plateforme.
                    </h1>
                    <p className="mt-4 text-[15px] leading-relaxed text-ink2 md:text-[17px]">
                        Gérez le taux de commission prélevé sur chaque mission.
                    </p>
                </div>

                <CommissionSettingsForm
                    initialRate={settings.commissionRate.toNumber()}
                    updatedAt={settings.updatedAt.toISOString()}
                />
            </main>
        </div>
    )
}
