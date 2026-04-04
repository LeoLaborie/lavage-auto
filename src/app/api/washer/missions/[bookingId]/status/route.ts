import { NextResponse } from 'next/server'
import { withWasherGuard } from '@/lib/auth/washerGuard'
import { prisma } from '@/lib/prisma'

/**
 * Allowed state machine transitions for laveur-initiated status updates.
 * COMPLETED is intentionally excluded: it is triggered by the client via
 * POST /api/booking/[id]/complete (Story 3.4 / Story 5.2).
 */
const ALLOWED_TRANSITIONS: Record<string, string> = {
    ACCEPTED: 'EN_ROUTE',
    EN_ROUTE: 'IN_PROGRESS',
}

const VALID_LAVEUR_STATUSES = ['EN_ROUTE', 'IN_PROGRESS'] as const
type ValidLaveurStatus = (typeof VALID_LAVEUR_STATUSES)[number]

/**
 * PATCH /api/washer/missions/[id]/status
 *
 * Allows a validated Laveur to advance their mission status:
 *   ACCEPTED → EN_ROUTE
 *   EN_ROUTE → IN_PROGRESS
 *
 * COMPLETED is NOT handled here — see POST /api/booking/[id]/complete.
 */
export const PATCH = withWasherGuard(async (req, _user, profile) => {
    try {
        // Extract booking ID from URL path (workaround: withWasherGuard wraps (req) only,
        // so we cannot use Next.js context params here).
        const url = new URL(req.url)
        // Path: /api/washer/missions/[id]/status  →  segments[-2] is the id
        const pathSegments = url.pathname.split('/')
        const bookingId = pathSegments[pathSegments.length - 2]

        if (!bookingId) {
            return NextResponse.json(
                { success: false, error: 'Identifiant de mission manquant' },
                { status: 400 }
            )
        }

        // AC#9: Parse and validate requested status
        const body = await req.json().catch(() => ({}))
        const newStatus: unknown = body?.status

        if (newStatus === 'COMPLETED') {
            return NextResponse.json(
                {
                    success: false,
                    error: "Utilisez l'endpoint /api/booking/[id]/complete pour marquer une mission comme terminée.",
                },
                { status: 400 }
            )
        }

        if (!VALID_LAVEUR_STATUSES.includes(newStatus as ValidLaveurStatus)) {
            return NextResponse.json(
                { success: false, error: 'Statut invalide. Valeurs acceptées : EN_ROUTE, IN_PROGRESS' },
                { status: 400 }
            )
        }

        // AC#6: Fetch the booking to check existence and ownership before attempting update
        const booking = await prisma.booking.findUnique({
            where: { id: bookingId },
            select: { id: true, laveurId: true, status: true, startedAt: true },
        })

        if (!booking) {
            return NextResponse.json(
                { success: false, error: 'Mission introuvable' },
                { status: 404 }
            )
        }

        // AC#5: Ownership check — laveur can only update their own missions
        if (booking.laveurId !== profile.userId) {
            return NextResponse.json(
                { success: false, error: 'Accès refusé' },
                { status: 403 }
            )
        }

        // AC#3: Validate state machine transition
        const expectedCurrentStatus = Object.keys(ALLOWED_TRANSITIONS).find(
            (from) => ALLOWED_TRANSITIONS[from] === newStatus
        )
        if (booking.status !== expectedCurrentStatus) {
            return NextResponse.json(
                {
                    success: false,
                    error: `Transition de statut invalide : ${booking.status} → ${newStatus}`,
                },
                { status: 409 }
            )
        }

        // AC#1 & #2: Atomic conditional update — guards against TOCTOU race conditions.
        // The where clause re-checks laveurId + status so a concurrent request cannot
        // advance the state twice.
        const updateData: Record<string, unknown> = { status: newStatus }
        if (newStatus === 'IN_PROGRESS' && !booking.startedAt) {
            // Set startedAt server-side when the wash begins (UTC, stored as-is by Prisma).
            // Only set if not already populated, to avoid overwriting a previous timestamp.
            updateData.startedAt = new Date()
        }

        const result = await prisma.booking.updateMany({
            where: {
                id: bookingId,
                laveurId: profile.userId,
                status: expectedCurrentStatus,
            },
            data: updateData,
        })

        if (result.count === 0) {
            // Race condition: another request already advanced the status
            return NextResponse.json(
                { success: false, error: `Transition de statut invalide : statut déjà modifié` },
                { status: 409 }
            )
        }

        // Re-fetch to get the persisted timestamps
        const updated = await prisma.booking.findUnique({ where: { id: bookingId } })

        return NextResponse.json({
            success: true,
            data: {
                bookingId: bookingId,
                status: newStatus,
                ...(newStatus === 'IN_PROGRESS' && {
                    startedAt: updated?.startedAt?.toISOString(),
                }),
            },
        })
    } catch (error: unknown) {
        console.error('[status] Error:', error)
        return NextResponse.json({ success: false, error: 'Erreur interne du serveur' }, { status: 500 })
    }
})
