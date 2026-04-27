type IconName =
    | 'car'
    | 'clock'
    | 'user'
    | 'bank'
    | 'hourglass'
    | 'info'

interface IconProps {
    name: IconName
    className?: string
}

const PATHS: Record<IconName, React.ReactNode> = {
    car: (
        <>
            <path d="M5 17h14M6.5 17v2M17.5 17v2M4 13l1.5-5a2 2 0 0 1 2-1.5h9a2 2 0 0 1 2 1.5L20 13M4 13h16v3a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-3z" />
            <circle cx="8" cy="14.5" r="0.6" fill="currentColor" stroke="none" />
            <circle cx="16" cy="14.5" r="0.6" fill="currentColor" stroke="none" />
        </>
    ),
    clock: (
        <>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" />
        </>
    ),
    user: (
        <>
            <circle cx="12" cy="8" r="4" />
            <path d="M4 21a8 8 0 0 1 16 0" />
        </>
    ),
    bank: (
        <>
            <path d="M3 10l9-6 9 6" />
            <path d="M5 10v8M9 10v8M15 10v8M19 10v8" />
            <path d="M3 21h18" />
        </>
    ),
    hourglass: (
        <>
            <path d="M6 3h12M6 21h12" />
            <path d="M7 3v3a5 5 0 0 0 10 0V3" />
            <path d="M7 21v-3a5 5 0 0 1 10 0v3" />
        </>
    ),
    info: (
        <>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 11v5M12 8h.01" />
        </>
    ),
}

export const Icon = ({ name, className = 'h-4 w-4' }: IconProps) => (
    <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
    >
        {PATHS[name]}
    </svg>
)
