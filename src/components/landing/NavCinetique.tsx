'use client'
import Image from 'next/image'
import Link from 'next/link'

const links = [
  { href: '#how', label: 'Comment ça marche' },
  { href: '#pricing', label: 'Tarifs' },
]

export default function NavCinetique() {
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
        <nav className="hidden items-center gap-8 font-cinsans text-sm font-medium text-ink md:flex">
          {links.map((l) => (
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
