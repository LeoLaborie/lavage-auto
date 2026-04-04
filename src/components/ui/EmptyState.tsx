'use client'

import React from 'react'

interface EmptyStateProps {
    icon: React.ReactNode
    title: string
    description?: string
    action?: {
        label: string
        href?: string
        onClick?: () => void
    }
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-12 px-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-400">
                {icon}
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
            {description && <p className="text-sm text-gray-500 text-center max-w-sm mb-4">{description}</p>}
            {action && (
                action.href ? (
                    <a href={action.href} className="px-4 py-2 bg-[#004aad] text-white text-sm font-medium rounded-lg hover:bg-[#003c8a] transition-colors">
                        {action.label}
                    </a>
                ) : action.onClick ? (
                    <button onClick={action.onClick} className="px-4 py-2 bg-[#004aad] text-white text-sm font-medium rounded-lg hover:bg-[#003c8a] transition-colors">
                        {action.label}
                    </button>
                ) : null
            )}
        </div>
    )
}

// Calendar icon for booking empty states
export function CalendarIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
        </svg>
    )
}

// Car icon for vehicle empty states
export function CarIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0H21M3.375 14.25h17.25M5.25 9.75L7.5 5.25h9l2.25 4.5M5.25 9.75h13.5M5.25 9.75H3.375" />
        </svg>
    )
}

// Briefcase/mission icon for washer empty states
export function MissionIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
        </svg>
    )
}
