import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import ClientDashboardView from '@/components/Dashboard/ClientDashboardView'
import WasherDashboardView from '@/components/Dashboard/WasherDashboardView'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
    title: 'Tableau de bord',
    description: 'Gérez vos réservations de lavage auto',
}

export default async function Dashboard() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Fetch DB user with profile and cars
    const dbUser = await prisma.user.findUnique({
        where: { authId: user.id },
        include: {
            profile: true,
            cars: {
                select: { id: true, make: true, model: true, plate: true },
                orderBy: { createdAt: 'desc' },
            },
        },
    })

    if (!dbUser) {
        redirect('/onboarding')
    }

    if (dbUser.role === 'CLIENT') {
        const bookings = await prisma.booking.findMany({
            where: { clientId: dbUser.id },
            orderBy: { scheduledDate: 'desc' },
            include: {
                laveur: {
                    include: { profile: true }
                },
                car: true
            }
        })

        // Serialize for Client Component
        const serializedBookings = bookings.map((b) => ({
            id: b.id,
            scheduledDate: b.scheduledDate.toISOString(),
            status: b.status === 'ACCEPTED' ? 'ASSIGNED' : b.status,
            finalPrice: b.amountCents / 100,
            beforePhotoUrl: b.beforePhotoUrl ?? null,
            afterPhotoUrl: b.afterPhotoUrl ?? null,
            awaitingReviewSince: b.awaitingReviewSince?.toISOString() ?? null,
            service: { name: b.serviceName },
            car: b.car ? {
                make: b.car.make,
                model: b.car.model
            } : {
                make: '—',
                model: '—'
            },
            assignment: b.laveur ? {
                washer: {
                    name: `${b.laveur.profile?.firstName || ''} ${b.laveur.profile?.lastName || ''}`.trim() || b.laveur.email,
                    phone: b.laveur.profile?.phone || ''
                }
            } : undefined
        }))

        return <ClientDashboardView initialBookings={serializedBookings} initialCars={dbUser.cars} />
    }

    if (dbUser.role === 'LAVEUR') {
        return <WasherDashboardView user={dbUser} />
    }

    // ADMIN users are redirected to the admin dashboard (Story 5.3)
    redirect('/admin')
}
