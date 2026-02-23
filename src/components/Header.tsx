'use client'
import { useAuth } from '@/contexts/AuthContext'
import { useState, useEffect } from 'react'
import DesktopMenu from './Navigation/DesktopMenu'
import MobileMenu from './Navigation/MobileMenu'

interface HeaderProps {
  currentPage?: string
}

export default function Header({ currentPage }: HeaderProps) {
  const { user, loading, signOut } = useAuth()
  const [dashboardUrl, setDashboardUrl] = useState<string | null>(null)

  useEffect(() => {
    const fetchRole = async () => {
      if (user) {
        try {
          const res = await fetch('/api/auth/role')
          if (res.ok) {
            const data = await res.json()
            if (data.success && data.data) {
              if (data.data.role === 'CLIENT' || data.data.role === 'LAVEUR') {
                setDashboardUrl('/dashboard')
              }
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
      await signOut()
    } catch (error) {
      console.error('Error signing out', error)
    }
  }

  return (
    <header className="bg-white/60 backdrop-blur-sm border-b border-secondary/20 shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="flex justify-between items-center py-2 h-20">
          <div className="flex items-center -my-2 h-full">
            <a
              href="/"
              className="w-32 h-16 rounded-lg flex items-center justify-center hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              aria-label="KLYN Accueil"
            >
              <img src="/klyn.png" alt="Logo KLYN" className="w-32 h-16 rounded-lg object-contain" />
            </a>
          </div>

          <DesktopMenu
            user={user}
            loading={loading}
            dashboardUrl={dashboardUrl}
            currentPage={currentPage}
            handleLogout={handleLogout}
          />

          <MobileMenu
            user={user}
            loading={loading}
            dashboardUrl={dashboardUrl}
            currentPage={currentPage}
            handleLogout={handleLogout}
          />
        </div>
      </div>
    </header>
  )
}