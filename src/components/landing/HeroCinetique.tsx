'use client'
import Link from 'next/link'
import { useRef } from 'react'
import { useScrollProgress } from '@/lib/hooks/useScrollProgress'
import IsometricCar from './IsometricCar'

const stats = [
  { k: '0L', l: "d'eau" },
  { k: '< 24h', l: 'créneau' },
]

export default function HeroCinetique() {
  const ref = useRef<HTMLElement>(null)
  // Outer wrapper is 200vh on desktop → progress 0 → 1 covers 200vh of scroll.
  // Sticky inner pins at top:0 from progress 0 to ~0.5 (when parent.bottom reaches viewport top).
  // Car becomes fully clean at progress ≈ 0.33 → leaves a "rest beat" before pin releases.
  const progress = useScrollProgress(ref)
  const dirty = Math.max(0, 1 - progress * 3)

  return (
    <section ref={ref} className="relative md:h-[200vh]">
      <div
        className="relative overflow-hidden px-5 pb-16 pt-8 md:sticky md:top-[var(--nav-h)] md:flex md:h-[calc(100vh-var(--nav-h))] md:items-center md:px-12 md:py-0"
        style={{
          background:
            'radial-gradient(ellipse at 70% 30%, #eaf0fc 0%, #ffffff 50%)',
        }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(rgba(6,8,13,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(6,8,13,0.03) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
            maskImage:
              'radial-gradient(ellipse at center, #000 30%, transparent 80%)',
            WebkitMaskImage:
              'radial-gradient(ellipse at center, #000 30%, transparent 80%)',
          }}
        />

        <div className="relative mx-auto grid w-full max-w-cin items-center gap-10 md:grid-cols-[1.1fr_1fr]">
          {/* Left column */}
          <div>
            <h1 className="font-display font-extrabold leading-[0.88] tracking-[-0.05em] text-ink text-[64px] sm:text-[88px] md:text-[96px] lg:text-[124px]">
              Lavage
              <br />
              auto
              <br />
              <span
                className="italic"
                style={{
                  background: 'linear-gradient(120deg, #1d4ed8, #3b82f6)',
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  color: 'transparent',
                }}
              >
                à&nbsp;domicile.
              </span>
            </h1>

            <p className="mt-6 max-w-[480px] text-base leading-relaxed text-ink2 md:mt-8 md:text-[19px]">
              Un laveur Nealkar vient laver votre voiture là où elle est garée.{' '}
              <b>Sans une goutte d&apos;eau.</b> Vous ne payez qu&apos;après
              avoir validé le résultat.
            </p>

            <div className="mt-8 flex flex-col gap-3 md:mt-9 md:flex-row md:items-center">
              <Link
                href="/reserver"
                className="inline-flex items-center justify-center gap-2.5 rounded-xl bg-ink px-6 py-4 font-cinsans text-[15px] font-semibold text-white shadow-cin-button transition-transform hover:-translate-y-0.5 md:px-7 md:py-[18px]"
              >
                Réserver maintenant
                <span className="rounded-md bg-blue-electric px-1.5 py-0.5 text-[11px] font-semibold text-white">
                  2 min
                </span>
              </Link>
              <a
                href="#how"
                onClick={(e) => {
                  e.preventDefault()
                  const target = document.querySelector('#how')
                  if (!target) return
                  const navH = parseInt(
                    getComputedStyle(document.documentElement).getPropertyValue('--nav-h') || '0',
                    10,
                  )
                  const top = target.getBoundingClientRect().top + window.scrollY - navH
                  window.scrollTo({ top, behavior: 'smooth' })
                }}
                className="inline-flex items-center justify-center rounded-xl border-[1.5px] border-ink bg-transparent px-6 py-4 font-cinsans text-[15px] font-semibold text-ink transition-colors hover:bg-ink hover:text-white md:px-[26px] md:py-[18px]"
              >
                Voir le procédé →
              </a>
            </div>

            <div className="mt-8 flex gap-6 border-t border-rule pt-6 md:mt-9 md:gap-9 md:pt-7">
              {stats.map((s) => (
                <div key={s.k}>
                  <div className="font-display text-[22px] font-bold tracking-[-0.02em] md:text-[28px]">
                    {s.k}
                  </div>
                  <div className="font-mono text-[11px] text-ink2 md:text-xs">
                    {s.l}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right column — animated car */}
          <div className="relative flex items-center justify-center">
            <div
              aria-hidden
              className="pointer-events-none absolute -inset-10 rounded-full"
              style={{
                background:
                  'radial-gradient(circle, rgba(59,130,246,0.13), transparent 60%)',
                filter: 'blur(20px)',
              }}
            />
            <IsometricCar progress={progress} dirty={dirty} />
          </div>
        </div>
      </div>
    </section>
  )
}
