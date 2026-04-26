'use client'
import Image from 'next/image'
import Link from 'next/link'

type Item = { label: string; href: string; anchor?: boolean }

const cols: { t: string; items: Item[] }[] = [
  {
    t: 'Service',
    items: [
      { label: 'Comment ça marche', href: '#how', anchor: true },
      { label: 'Tarifs', href: '#pricing', anchor: true },
    ],
  },
  {
    t: 'Compte',
    items: [
      { label: 'Connexion', href: '/login' },
      { label: 'Réserver', href: '/reserver' },
    ],
  },
  {
    t: 'Contact',
    items: [{ label: 'Nous écrire', href: '/contact' }],
  },
]

export default function FooterCinetique() {
  const handleSmoothScroll = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string,
  ) => {
    e.preventDefault()
    const target = document.querySelector(href)
    if (!target) return
    const navH = parseInt(
      getComputedStyle(document.documentElement).getPropertyValue('--nav-h') ||
        '0',
      10,
    )
    const top = target.getBoundingClientRect().top + window.scrollY - navH
    window.scrollTo({ top, behavior: 'smooth' })
  }

  return (
    <footer
      className="border-t bg-ink px-5 pb-9 pt-12 text-white md:px-12 md:pb-9 md:pt-14"
      style={{ borderColor: 'rgba(255,255,255,0.08)' }}
    >
      <div className="mx-auto max-w-cin">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-[2fr_1fr_1fr_1fr] md:gap-12">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" aria-label="Nealkar — accueil" className="inline-block">
              <Image
                src="/images/nealkar-logo.png"
                alt="Nealkar"
                width={1024}
                height={339}
                className="h-7 w-auto md:h-8"
                style={{ filter: 'brightness(0) invert(1)' }}
              />
            </Link>
            <p className="mt-4 max-w-[280px] text-[13px] opacity-60">
              Lavage automobile à domicile, sans eau, partout en France.
            </p>
          </div>
          {cols.map((c) => (
            <div key={c.t}>
              <div className="mb-3.5 font-mono text-[11px] uppercase tracking-[0.08em] opacity-50 md:text-xs">
                {c.t}
              </div>
              <ul className="m-0 flex list-none flex-col gap-2 p-0 text-[13px] md:text-sm">
                {c.items.map((it) => (
                  <li
                    key={it.label}
                    className="opacity-85 transition-opacity hover:opacity-100"
                  >
                    {it.anchor ? (
                      <a
                        href={it.href}
                        onClick={(e) => handleSmoothScroll(e, it.href)}
                      >
                        {it.label}
                      </a>
                    ) : (
                      <Link href={it.href}>{it.label}</Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div
          className="mt-10 flex flex-col justify-between gap-2 border-t pt-5 font-mono text-[11px] opacity-50 md:flex-row md:text-xs"
          style={{ borderColor: 'rgba(255,255,255,0.08)' }}
        >
          <span>© Nealkar {new Date().getFullYear()}</span>
          <span>Made with 0L of water</span>
        </div>
      </div>
    </footer>
  )
}
