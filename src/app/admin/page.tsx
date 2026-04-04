import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import AdminDashboard from '@/components/features/admin/AdminDashboard'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
    title: 'Administration',
    description: 'Panneau d\'administration Nealkar',
}

export default async function AdminPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const dbUser = await prisma.user.findUnique({
        where: { authId: user.id },
    })

    if (!dbUser) {
        redirect('/login')
    }

    if (dbUser.role !== 'ADMIN') {
        redirect('/dashboard')
    }

    // Fetch all initial data in parallel — never sequentially
    const [users, usersTotal, bookings, bookingsTotal, payments, paymentsTotal] = await Promise.all([
        prisma.user.findMany({
            take: 20,
            orderBy: { createdAt: 'desc' },
            include: { profile: true },
        }),
        prisma.user.count(),
        prisma.booking.findMany({
            take: 20,
            orderBy: { scheduledDate: 'desc' },
            include: { client: true, laveur: true, payment: true },
        }),
        prisma.booking.count(),
        prisma.payment.findMany({
            take: 20,
            orderBy: { createdAt: 'desc' },
            include: { user: true },
        }),
        prisma.payment.count(),
    ])

    // Serialize DateTime fields — not serializable across Server/Client boundary
    const serializedUsers = users.map((u) => ({
        id: u.id,
        email: u.email,
        role: u.role,
        createdAt: u.createdAt.toISOString(),
        profile: u.profile
            ? {
                status: u.profile.status,
                firstName: u.profile.firstName,
                lastName: u.profile.lastName,
                siret: u.profile.siret,
                companyName: u.profile.companyName,
            }
            : null,
    }))

    const serializedBookings = bookings.map((b) => ({
        id: b.id,
        clientEmail: b.client.email,
        laveurEmail: b.laveur?.email ?? null,
        serviceName: b.serviceName,
        amountEur: b.amountCents / 100,
        status: b.status,
        scheduledDate: b.scheduledDate.toISOString(),
        beforePhotoUrl: b.beforePhotoUrl ?? null,
        afterPhotoUrl: b.afterPhotoUrl ?? null,
        paymentStatus: b.payment?.status ?? null,
    }))

    const serializedPayments = payments.map((p) => ({
        id: p.id,
        bookingId: p.bookingId,
        userEmail: p.user.email,
        amountEur: p.amountCents / 100,
        status: p.status,
        stripeSessionId: p.stripeSessionId ?? null,
        stripePaymentIntentId: p.stripePaymentIntentId ?? null,
        refundAmountCents: p.refundAmountCents ?? null,
        paidOutAt: p.paidOutAt ? p.paidOutAt.toISOString() : null,
        createdAt: p.createdAt.toISOString(),
    }))

    return (
        <AdminDashboard
            initialUsers={serializedUsers}
            usersTotal={usersTotal}
            initialBookings={serializedBookings}
            bookingsTotal={bookingsTotal}
            initialPayments={serializedPayments}
            paymentsTotal={paymentsTotal}
            pageSize={20}
        />
    )
}
