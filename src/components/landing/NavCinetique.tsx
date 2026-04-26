'use client'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { useAuth } from '@/contexts/AuthContext'
import { useUserRole } from '@/lib/hooks/useUserRole'
import ReservationButton from '@/components/ReservationButton'

const landingLinks = [
  { href: '#how', label: 'Comment ça marche' },
  { href: '#pricing', label: 'Tarifs' },
]

export default function NavCinetique() {
  const pathname = usePathname()
  const { user, loading, signOut } = useAuth()
  const { dashboardUrl } = useUserRole(user)

  const isLanding = pathname === null || pathname === '/'
  const hideReserveCta = pathname === '/reserver' || pathname === '/login'
  const hideLoginLink = pathname === '/login'

  const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault()
    const target = document.querySelector(href)
    if (!target) return
    const navH = parseInt(
      getComputedStyle(document.documentElement).getPropertyValue('--nav-h') || '0',
      10,
    )
    const top = target.getBoundingClientRect().top + window.scrollY - navH
    window.scrollTo({ top, behavior: 'smooth' })
  }

  const handleLogout = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('NavCinetique: signOut failed', error)
    }
  }

  return (
    <header
      className="sticky top-0 z-30 border-b border-rule backdrop-blur-[10px]"
      style={{ background: '#ffffffea', height: 'var(--nav-h)' }}
    >
      <div className="mx-auto flex h-full max-w-cin items-center justify-between px-5 md:px-12">
        <Link href="/" className="shrink-0" aria-label="Nealkar — accueil">
          <Image
            src="/images/nealkar-logo.png"
            alt="Nealkar"
            width={1024}
            height={339}
            priority
            className="h-7 w-auto md:h-8"
          />
        </Link>

        {isLanding && (
          <nav className="hidden items-center gap-8 font-cinsans text-sm font-medium text-ink md:flex">
            {landingLinks.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={(e) => handleSmoothScroll(e, l.href)}
                className="transition-colors hover:text-blue"
              >
                {l.label}
              </a>
            ))}
          </nav>
        )}

        <div className="flex items-center gap-3">
          {loading ? (
            <div className="h-9 w-24 animate-pulse rounded-[10px] bg-rule" aria-hidden="true" />
          ) : user ? (
            <UserMenu user={user} dashboardUrl={dashboardUrl} onLogout={handleLogout} />
          ) : (
            !hideLoginLink && (
              <Link
                href="/login"
                className="hidden font-cinsans text-sm font-medium text-ink transition-colors hover:text-blue md:inline-block"
              >
                Connexion
              </Link>
            )
          )}
          {!hideReserveCta && <ReservationButton />}
        </div>
      </div>
    </header>
  )
}

interface UserMenuProps {
  user: User
  dashboardUrl: string | null
  onLogout: () => void | Promise<void>
}

function UserMenu({ user, dashboardUrl, onLogout }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  const profileImage: string | null = user.user_metadata?.avatar_url ?? null
  const displayName: string =
    (user.user_metadata?.name as string | undefined) ?? user.email ?? ''
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="flex items-center rounded-full p-0.5 transition-colors hover:bg-rule/40 focus:outline-none focus:ring-2 focus:ring-blue focus:ring-offset-2"
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-controls="user-menu"
        aria-label="Menu utilisateur"
      >
        {profileImage ? (
          <img
            src={profileImage}
            alt=""
            className="h-9 w-9 rounded-full border border-rule object-cover"
          />
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-ink font-cinsans text-xs font-semibold text-white">
            {initials || '·'}
          </div>
        )}
      </button>

      {isOpen && (
        <div
          id="user-menu"
          role="menu"
          aria-orientation="vertical"
          className="absolute right-0 mt-2 w-56 origin-top-right rounded-[10px] border border-rule bg-white py-2 shadow-cin-md"
        >
          <div className="border-b border-rule px-4 py-2" role="none">
            <p className="truncate font-cinsans text-sm font-medium text-ink" role="none">
              {(user.user_metadata?.name as string | undefined) ?? user.email}
            </p>
            <p className="truncate font-cinsans text-xs text-ink/60" role="none">
              {user.email}
            </p>
          </div>
          {dashboardUrl && (
            <Link
              href={dashboardUrl}
              role="menuitem"
              onClick={() => setIsOpen(false)}
              className="block px-4 py-2 font-cinsans text-sm text-ink transition-colors hover:bg-blue-wash hover:text-blue focus:bg-blue-wash focus:outline-none"
            >
              Tableau de bord
            </Link>
          )}
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setIsOpen(false)
              void onLogout()
            }}
            className="block w-full px-4 py-2 text-left font-cinsans text-sm text-red-600 transition-colors hover:bg-red-50 focus:bg-red-50 focus:outline-none"
          >
            Se déconnecter
          </button>
        </div>
      )}
    </div>
  )
}
