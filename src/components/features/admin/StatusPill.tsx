type BookingStatus = 'PENDING' | 'CONFIRMED' | 'ACCEPTED' | 'EN_ROUTE' | 'IN_PROGRESS' | 'AWAITING_REVIEW' | 'COMPLETED' | 'CANCELLED'
type PaymentStatus = 'PENDING' | 'PROCESSING' | 'SUCCEEDED' | 'FAILED' | 'REFUNDED' | 'PARTIALLY_REFUNDED'
type ProfileStatus = 'VALIDATION_PENDING' | 'VALIDATED' | 'REJECTED'
type UserRole = 'CLIENT' | 'LAVEUR' | 'ADMIN'

const PILL_BASE =
    'inline-flex items-center rounded-md px-2 py-1 font-mono text-[11px] font-semibold uppercase tracking-[0.05em]'

const TONE = {
    neutral: 'bg-blue-wash text-ink2',
    active: 'bg-blue/10 text-blue',
    success: 'bg-emerald-50 text-emerald-700',
    danger: 'bg-red-50 text-red-700',
    warning: 'bg-amber-50 text-amber-700',
} as const

type Tone = keyof typeof TONE

function pillClass(tone: Tone) {
    return `${PILL_BASE} ${TONE[tone]}`
}

const BOOKING: Record<BookingStatus, { tone: Tone; label: string }> = {
    PENDING: { tone: 'neutral', label: 'En attente' },
    CONFIRMED: { tone: 'active', label: 'Confirmé' },
    ACCEPTED: { tone: 'active', label: 'Accepté' },
    EN_ROUTE: { tone: 'active', label: 'En route' },
    IN_PROGRESS: { tone: 'active', label: 'En cours' },
    AWAITING_REVIEW: { tone: 'warning', label: 'À valider' },
    COMPLETED: { tone: 'success', label: 'Terminé' },
    CANCELLED: { tone: 'danger', label: 'Annulé' },
}

const PAYMENT: Record<PaymentStatus, { tone: Tone; label: string }> = {
    PENDING: { tone: 'neutral', label: 'En attente' },
    PROCESSING: { tone: 'active', label: 'En cours' },
    SUCCEEDED: { tone: 'success', label: 'Réussi' },
    FAILED: { tone: 'danger', label: 'Échoué' },
    REFUNDED: { tone: 'warning', label: 'Remboursé' },
    PARTIALLY_REFUNDED: { tone: 'warning', label: 'Part. remboursé' },
}

const PROFILE: Record<ProfileStatus, { tone: Tone; label: string }> = {
    VALIDATION_PENDING: { tone: 'neutral', label: 'En attente' },
    VALIDATED: { tone: 'success', label: 'Validé' },
    REJECTED: { tone: 'danger', label: 'Rejeté' },
}

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
    const cfg = BOOKING[status]
    return <span className={pillClass(cfg.tone)}>{cfg.label}</span>
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus | null }) {
    if (!status) return <span className="font-mono text-[11px] text-ink2/60">—</span>
    const cfg = PAYMENT[status]
    return <span className={pillClass(cfg.tone)}>{cfg.label}</span>
}

export function ProfileStatusBadge({ status }: { status: ProfileStatus | null }) {
    if (!status) return <span className="font-mono text-[11px] text-ink2/60">—</span>
    const cfg = PROFILE[status]
    return <span className={pillClass(cfg.tone)}>{cfg.label}</span>
}

export function RoleBadge({ role }: { role: UserRole }) {
    return <span className={pillClass('neutral')}>{role}</span>
}
