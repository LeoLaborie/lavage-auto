'use client'
import { useAuth } from '@/contexts/AuthContext'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface HeaderProps {
  currentPage?: string
}

export default function Header({ currentPage }: HeaderProps) {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const mobileMenuRef = useRef<HTMLDivElement>(null)



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
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
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
    <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">🚗</span>
            </div>
            <a href="/" className="ml-3 text-xl font-bold text-gray-900">Lavage Auto</a>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            <a href="/#services" className="text-gray-700 hover:text-blue-600 transition-colors">Services</a>
            <a href="/#how-it-works" className="text-gray-700 hover:text-blue-600 transition-colors">Comment ça marche</a>
            <a href="/contact" className={`transition-colors ${currentPage === 'contact' ? 'text-blue-600 font-medium' : 'text-gray-700 hover:text-blue-600'}`}>Contact</a>
          </nav>
          {/* Desktop Actions */}
          <div className="hidden md:flex gap-3 items-center">
            {loading ? (
              <div className="px-6 py-2">
                <div className="animate-pulse w-24 h-6 bg-gray-200 rounded"></div>
              </div>
            ) : user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={toggleDropdown}
                  className="flex items-center space-x-2 p-1 rounded-full hover:bg-gray-100 transition-colors"
                >
                  {getProfileImage() ? (
                    <img
                      src={getProfileImage()!}
                      alt="Profile"
                      className="w-10 h-10 rounded-full object-cover border-2 border-blue-200"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
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
                    <a
                      href="/mes-reservations"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      📅 Mes réservations
                    </a>
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
              <a href="/login" className="border-2 border-blue-600 text-blue-600 px-6 py-2 rounded-lg hover:bg-blue-50 transition-colors inline-block">
                Se connecter
              </a>
            )}
            
            {currentPage !== 'booking' && (
              <a href="/reserver" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors inline-block">
                Réserver
              </a>
            )}
            
            {currentPage === 'booking' && (
              <span className="text-blue-600 font-medium px-6 py-2">Réservation</span>
            )}
            
            {currentPage === 'login' && (
              <span className="text-blue-600 font-medium px-6 py-2">Connexion</span>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            {/* Profile/Login for mobile */}
            {loading ? (
              <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
            ) : user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={toggleDropdown}
                  className="flex items-center p-1 rounded-full hover:bg-gray-100 transition-colors"
                >
                  {getProfileImage() ? (
                    <img
                      src={getProfileImage()!}
                      alt="Profile"
                      className="w-8 h-8 rounded-full object-cover border-2 border-blue-200"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium text-xs">
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
                    <a
                      href="/mes-reservations"
                      className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      📅 Mes réservations
                    </a>
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
              <a href="/login" className="text-blue-600 text-sm px-3 py-1 border border-blue-600 rounded hover:bg-blue-50 transition-colors">
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
              <a
                href="/#services"
                className="block text-gray-700 hover:text-blue-600 transition-colors text-lg py-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Services
              </a>
              <a
                href="/#how-it-works"
                className="block text-gray-700 hover:text-blue-600 transition-colors text-lg py-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Comment ça marche
              </a>
              <a
                href="/contact"
                className={`block transition-colors text-lg py-2 ${currentPage === 'contact' ? 'text-blue-600 font-medium' : 'text-gray-700 hover:text-blue-600'}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Contact
              </a>
              
              <div className="pt-4 border-t border-gray-200">
                {currentPage !== 'booking' && (
                  <a
                    href="/reserver"
                    className="block w-full bg-blue-600 text-white text-center py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Réserver maintenant
                  </a>
                )}
                
                {currentPage === 'booking' && (
                  <div className="text-blue-600 font-medium text-center py-3">
                    Réservation en cours
                  </div>
                )}
                
                {currentPage === 'login' && (
                  <div className="text-blue-600 font-medium text-center py-3">
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