'use client'
import { useState, useRef, useEffect } from 'react'
import ReservationButton from '../ReservationButton'

interface DesktopMenuProps {
    user: any;
    loading: boolean;
    dashboardUrl: string | null;
    currentPage?: string;
    handleLogout: () => void;
}

export default function DesktopMenu({ user, loading, dashboardUrl, currentPage, handleLogout }: DesktopMenuProps) {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // Close dropdown on Escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setIsDropdownOpen(false);
            }
        }
        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [])

    const getProfileImage = () => user?.user_metadata?.avatar_url || null
    const getUserInitials = () => {
        const name = user?.user_metadata?.name || user?.email || ''
        return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    }

    return (
        <div className="hidden md:flex gap-3 items-center">
            {loading ? (
                <div className="px-6 py-2">
                    <div className="animate-pulse w-24 h-6 bg-gray-200 rounded"></div>
                </div>
            ) : user ? (
                <div className="relative" ref={dropdownRef}>
                    <button
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="flex items-center space-x-2 p-1 rounded-full hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                        aria-expanded={isDropdownOpen}
                        aria-haspopup="menu"
                        aria-label="Menu utilisateur"
                        aria-controls="desktop-user-menu"
                    >
                        {getProfileImage() ? (
                            <img src={getProfileImage()!} alt="Profile" className="w-10 h-10 rounded-full object-cover border-2 border-[#004aad]/20" />
                        ) : (
                            <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center text-white font-medium text-sm shadow-lg">
                                {getUserInitials()}
                            </div>
                        )}
                    </button>

                    {isDropdownOpen && (
                        <div
                            id="desktop-user-menu"
                            className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 origin-top-right transition-transform"
                            role="menu"
                            aria-orientation="vertical"
                        >
                            <div className="px-4 py-2 border-b border-gray-100" role="none">
                                <p className="text-sm font-medium text-gray-900 truncate" role="none">
                                    {user.user_metadata?.name || user.email}
                                </p>
                                <p className="text-xs text-gray-500 truncate" role="none">{user.email}</p>
                            </div>
                            {dashboardUrl && (
                                <a
                                    href={dashboardUrl}
                                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors focus:outline-none focus:bg-gray-100"
                                    onClick={() => setIsDropdownOpen(false)}
                                    role="menuitem"
                                >
                                    📊 Tableau de bord
                                </a>
                            )}
                            <button
                                onClick={handleLogout}
                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors focus:outline-none focus:bg-red-50"
                                role="menuitem"
                            >
                                🚪 Se déconnecter
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                <a href="/login" className="border-2 border-primary text-primary px-6 py-2 rounded-lg hover:bg-primary hover:text-white transition-all transform hover:scale-105 inline-block focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
                    Se connecter
                </a>
            )}

            {currentPage !== 'booking' && <ReservationButton />}
            {currentPage === 'booking' && <span className="text-[#004aad] font-medium px-6 py-2">Réservation</span>}
            {currentPage === 'login' && <span className="text-[#004aad] font-medium px-6 py-2">Connexion</span>}
        </div>
    )
}
