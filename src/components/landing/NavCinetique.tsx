'use client'
import Link from 'next/link'
import Wordmark from './Wordmark'

const links = [
  { href: '#how', label: 'Comment ça marche' },
  { href: '#pricing', label: 'Tarifs' },
  { href: '/recrutement', label: 'Devenir laveur' },
  { href: '#faq', label: 'FAQ' },
]

export default function NavCinetique() {
  return (
    <header
      className="sticky top-0 z-30 border-b border-rule backdrop-blur-[10px]"
      style={{ background: '#ffffffea', height: 'var(--nav-h)' }}
    >
      <div className="mx-auto flex h-full max-w-cin items-center justify-between px-5 md:px-12">
        <Link href="/" className="shrink-0">
          <Wordmark animated />
        </Link>
        <nav className="hidden items-center gap-8 font-cinsans text-sm font-medium text-ink md:flex">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="transition-colors hover:text-blue">
              {l.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden font-cinsans text-sm font-medium text-ink transition-colors hover:text-blue md:inline-block"
          >
            Connexion
          </Link>
          <Link
            href="/reserver"
            className="rounded-[10px] bg-ink px-4 py-2.5 font-cinsans text-sm font-semibold text-white shadow-[0_4px_14px_rgba(10,28,92,0.3)] transition-transform hover:-translate-y-0.5 md:px-[22px] md:py-[11px]"
          >
            Réserver
          </Link>
        </div>
      </div>
    </header>
  )
}
