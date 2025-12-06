'use client'
import { useAuth } from '@/contexts/AuthContext'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ReservationButton from './ReservationButton'

interface HeaderProps {
  currentPage?: string
}

export default function Header({ currentPage }: HeaderProps) {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [dashboardUrl, setDashboardUrl] = useState<string | null>(null)
  const desktopDropdownRef = useRef<HTMLDivElement>(null)
  const mobileDropdownRef = useRef<HTMLDivElement>(null)
  const mobileMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchRole = async () => {
      if (user) {
        try {
          const res = await fetch('/api/auth/role')
          if (res.ok) {
            const data = await res.json()
            if (data.role === 'CLIENT') {
              setDashboardUrl('/dashboard/client')
            } else if (data.role === 'WASHER') {
              setDashboardUrl('/dashboard/laveur')
            }
          }
        } catch (error) {
          console.error('Error fetching role:', error)
        }
      }
    }
    fetchRole()
  }, [user])

  const handleLogout = async () => {
    try {
      setIsDropdownOpen(false)
      setIsMobileMenuOpen(false)
      await signOut()
    } catch (error) {
      // Fallback handled in signOut function
    }
  }

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen)
  }

  // Close dropdown/menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Check desktop dropdown
      if (desktopDropdownRef.current && !desktopDropdownRef.current.contains(event.target as Node)) {
        // Only close if we're not clicking in the mobile dropdown (if it exists/is visible)
        if (!mobileDropdownRef.current || !mobileDropdownRef.current.contains(event.target as Node)) {
          setIsDropdownOpen(false)
        }
      }

      // Check mobile menu
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  // Get user profile picture or generate initials
  const getProfileImage = () => {
    if (user?.user_metadata?.avatar_url) {
      return user.user_metadata.avatar_url
    }
    return null
  }

  const getUserInitials = () => {
    const name = user?.user_metadata?.name || user?.email || ''
    const initials = name.split(' ').map((n: string) => n[0]).join('').toUpperCase()
    return initials.slice(0, 2)
  }

  return (
    <header className="bg-white/60 backdrop-blur-sm border-b border-secondary/20 shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-2">
          <div className="flex items-center -my-2">
            <a href="/" className="w-32 h-16 rounded-lg flex items-center justify-center hover:opacity-90 transition-opacity">
              <img src="/klyn.png" alt="Logo" className="w-32 h-16 rounded-lg object-contain" />
            </a>
          </div>


          {/* Desktop Actions */}
          <div className="hidden md:flex gap-3 items-center">
            {loading ? (
              <div className="px-6 py-2">
                <div className="animate-pulse w-24 h-6 bg-gray-200 rounded"></div>
              </div>
            ) : user ? (
              <div className="relative" ref={desktopDropdownRef}>
                <button
                  onClick={toggleDropdown}
                  className="flex items-center space-x-2 p-1 rounded-full hover:bg-gray-100 transition-colors"
                >
                  {getProfileImage() ? (
                    <img
                      src={getProfileImage()!}
                      alt="Profile"
                      className="w-10 h-10 rounded-full object-cover border-2 border-[#004aad]/20"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center text-white font-medium text-sm shadow-lg">
                      {getUserInitials()}
                    </div>
                  )}
                </button>

                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {user.user_metadata?.name || user.email}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                    {dashboardUrl && (
                      <a
                        href={dashboardUrl}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        📊 Tableau de bord
                      </a>
                    )}

                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      🚪 Se déconnecter
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <a href="/login" className="border-2 border-primary text-primary px-6 py-2 rounded-lg hover:bg-primary hover:text-white transition-all transform hover:scale-105 inline-block">
                Se connecter
              </a>
            )}

            {currentPage !== 'booking' && (
              <ReservationButton />
            )}

            {currentPage === 'booking' && (
              <span className="text-[#004aad] font-medium px-6 py-2">Réservation</span>
            )}

            {currentPage === 'login' && (
              <span className="text-[#004aad] font-medium px-6 py-2">Connexion</span>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            {/* Profile/Login for mobile */}
            {loading ? (
              <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
            ) : user ? (
              <div className="relative" ref={mobileDropdownRef}>
                <button
                  onClick={toggleDropdown}
                  className="flex items-center p-1 rounded-full hover:bg-gray-100 transition-colors"
                >
                  {getProfileImage() ? (
                    <img
                      src={getProfileImage()!}
                      alt="Profile"
                      className="w-8 h-8 rounded-full object-cover border-2 border-[#004aad]/20"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-[#004aad] rounded-full flex items-center justify-center text-white font-medium text-xs">
                      {getUserInitials()}
                    </div>
                  )}
                </button>

                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {user.user_metadata?.name || user.email}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                    {dashboardUrl && (
                      <a
                        href={dashboardUrl}
                        className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        📊 Tableau de bord
                      </a>
                    )}

                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      🚪 Se déconnecter
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <a href="/login" className="text-[#004aad] text-sm px-3 py-1 border border-[#004aad] rounded hover:bg-[#004aad]/5 transition-colors">
                Login
              </a>
            )}

            {/* Hamburger Menu Button */}
            <button
              onClick={toggleMobileMenu}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Menu"
            >
              <div className="w-6 h-6 flex flex-col justify-center items-center">
                <span className={`bg-gray-700 block transition-all duration-300 ease-out h-0.5 w-6 rounded-sm ${isMobileMenuOpen ? 'rotate-45 translate-y-1' : '-translate-y-0.5'}`}></span>
                <span className={`bg-gray-700 block transition-all duration-300 ease-out h-0.5 w-6 rounded-sm my-0.5 ${isMobileMenuOpen ? 'opacity-0' : 'opacity-100'}`}></span>
                <span className={`bg-gray-700 block transition-all duration-300 ease-out h-0.5 w-6 rounded-sm ${isMobileMenuOpen ? '-rotate-45 -translate-y-1' : 'translate-y-0.5'}`}></span>
              </div>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div ref={mobileMenuRef} className="md:hidden border-t border-gray-200 bg-white/95 backdrop-blur-sm">
            <div className="px-4 py-6 space-y-4">


              <div className="pt-4 border-t border-gray-200">
                {currentPage !== 'booking' && (
                  <a
                    href="/reserver"
                    className="block w-full bg-[#004aad] text-white text-center py-3 rounded-lg font-medium hover:bg-[#003c8a] transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Réserver maintenant
                  </a>
                )}

                {currentPage === 'booking' && (
                  <div className="text-[#004aad] font-medium text-center py-3">
                    Réservation en cours
                  </div>
                )}

                {currentPage === 'login' && (
                  <div className="text-[#004aad] font-medium text-center py-3">
                    Connexion
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}