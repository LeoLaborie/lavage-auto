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
        <div className="min-h-screen bg-gray-50 py-12">
            <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Paramètres plateforme</h1>
                <p className="text-gray-600 mb-8">Gérez le taux de commission prélevé sur chaque mission.</p>

                <CommissionSettingsForm
                    initialRate={settings.commissionRate.toNumber()}
                    updatedAt={settings.updatedAt.toISOString()}
                />
            </main>
        </div>
    )
}
