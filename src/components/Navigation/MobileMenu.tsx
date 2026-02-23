'use client'
import { useState, useRef, useEffect } from 'react'

interface MobileMenuProps {
    user: any;
    loading: boolean;
    dashboardUrl: string | null;
    currentPage?: string;
    handleLogout: () => void;
}

export default function MobileMenu({ user, loading, dashboardUrl, currentPage, handleLogout }: MobileMenuProps) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)
    const mobileMenuRef = useRef<HTMLDivElement>(null)
    const mobileDropdownRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (mobileDropdownRef.current && !mobileDropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false)
            }
            if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
                setIsMobileMenuOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // Close menu on escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setIsMobileMenuOpen(false);
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
        <>
            <div className="md:hidden flex items-center gap-2">
                {loading ? (
                    <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
                ) : user ? (
                    <div className="relative" ref={mobileDropdownRef}>
                        <button
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="flex items-center p-1 rounded-full hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                            aria-expanded={isDropdownOpen}
                            aria-haspopup="menu"
                            aria-label="Menu utilisateur mobile"
                            aria-controls="mobile-user-menu"
                        >
                            {getProfileImage() ? (
                                <img src={getProfileImage()!} alt="Profile" className="w-8 h-8 rounded-full object-cover border-2 border-[#004aad]/20" />
                            ) : (
                                <div className="w-8 h-8 bg-[#004aad] rounded-full flex items-center justify-center text-white font-medium text-xs">
                                    {getUserInitials()}
                                </div>
                            )}
                        </button>

                        {isDropdownOpen && (
                            <div
                                id="mobile-user-menu"
                                className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50 origin-top-right"
                                role="menu"
                                aria-orientation="vertical"
                            >
                                <div className="px-4 py-3 border-b border-gray-100" role="none">
                                    <p className="text-sm font-medium text-gray-900 truncate" role="none">{user.user_metadata?.name || user.email}</p>
                                    <p className="text-xs text-gray-500 truncate" role="none">{user.email}</p>
                                </div>
                                {dashboardUrl && (
                                    <a
                                        href={dashboardUrl}
                                        className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 transition-colors focus:outline-none focus:bg-gray-100"
                                        onClick={() => setIsDropdownOpen(false)}
                                        role="menuitem"
                                    >
                                        📊 Tableau de bord
                                    </a>
                                )}
                                <button
                                    onClick={handleLogout}
                                    className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors focus:outline-none focus:bg-red-50"
                                    role="menuitem"
                                >
                                    🚪 Se déconnecter
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <a href="/login" className="text-[#004aad] text-sm px-3 py-1 border border-[#004aad] rounded hover:bg-[#004aad]/5 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
                        Login
                    </a>
                )}

                <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                    aria-label={isMobileMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
                    aria-expanded={isMobileMenuOpen}
                    aria-controls="mobile-main-menu"
                >
                    <div className="w-6 h-6 flex flex-col justify-center items-center" aria-hidden="true">
                        <span className={`bg-gray-700 block transition-all duration-300 ease-out h-0.5 w-6 rounded-sm ${isMobileMenuOpen ? 'rotate-45 translate-y-1' : '-translate-y-0.5'}`}></span>
                        <span className={`bg-gray-700 block transition-all duration-300 ease-out h-0.5 w-6 rounded-sm my-0.5 ${isMobileMenuOpen ? 'opacity-0' : 'opacity-100'}`}></span>
                        <span className={`bg-gray-700 block transition-all duration-300 ease-out h-0.5 w-6 rounded-sm ${isMobileMenuOpen ? '-rotate-45 -translate-y-1' : 'translate-y-0.5'}`}></span>
                    </div>
                </button>
            </div>

            {isMobileMenuOpen && (
                <div id="mobile-main-menu" ref={mobileMenuRef} className="md:hidden border-t border-gray-200 bg-white/95 backdrop-blur-sm shadow-xl absolute top-full left-0 w-full z-40">
                    <div className="px-4 py-6 space-y-4">
                        <div className="pt-4 border-t border-gray-200">
                            {currentPage !== 'booking' && (
                                <a
                                    href="/reserver"
                                    className="block w-full bg-[#004aad] text-white text-center py-3 rounded-lg font-medium hover:bg-[#003c8a] transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    Réserver maintenant
                                </a>
                            )}
                            {currentPage === 'booking' && <div className="text-[#004aad] font-medium text-center py-3">Réservation en cours</div>}
                            {currentPage === 'login' && <div className="text-[#004aad] font-medium text-center py-3">Connexion</div>}
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
