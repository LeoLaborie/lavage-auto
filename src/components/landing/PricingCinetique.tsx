import Link from 'next/link'
import { services } from '@/lib/constants/services'

const emojiById: Record<string, string> = {
  'lavage-exterieur': '🧽',
  'lavage-complet': '✨',
  'lavage-premium': '💎',
}

const featuredId = 'lavage-complet'

export default function PricingCinetique() {
  const visible = services.filter((s) => s.isVisible)

  return (
    <section id="pricing" className="bg-blue-wash px-5 py-16 md:px-12 md:py-[120px]">
      <div className="mx-auto max-w-cin">
        <div className="mb-10 text-center md:mb-[60px]">
          <div className="mb-5 inline-block rounded-md bg-white px-3 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.05em] text-blue md:text-xs">
            Tarifs
          </div>
          <h2 className="m-0 font-display font-extrabold leading-[0.95] tracking-[-0.04em] text-[44px] md:text-[64px] lg:text-[80px]">
            Trois formules.
            <br />
            <span className="italic text-blue">Aucun engagement.</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-3.5 md:grid-cols-3 md:gap-5">
          {visible.map((service) => {
            const featured = service.id === featuredId
            const emoji = emojiById[service.id] ?? '🧼'

            return (
              <article
                key={service.id}
                className={`relative flex flex-col rounded-[20px] p-7 md:p-9 ${
                  featured
                    ? 'bg-ink text-white shadow-cin-feature md:-translate-y-3'
                    : 'bg-white text-ink shadow-cin-card'
                }`}
              >
                <header className="mb-7 flex items-start gap-4">
                  <span
                    aria-hidden
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] text-2xl md:h-14 md:w-14 md:text-[28px] ${
                      featured ? 'bg-white/10' : 'bg-blue-wash'
                    }`}
                  >
                    {emoji}
                  </span>
                </header>

                {featured && (
                  <div className="absolute right-5 top-5 rounded-full bg-blue-electric px-2.5 py-1 font-mono text-[10px] font-semibold tracking-[0.05em] text-white md:text-[11px]">
                    POPULAIRE
                  </div>
                )}

                <h3 className="m-0 mb-1 font-display text-[26px] font-bold tracking-[-0.03em] md:text-[34px]">
                  {service.name}
                </h3>
                <p
                  className={`mb-6 text-[13px] leading-relaxed md:text-sm ${
                    featured ? 'text-white/70' : 'text-ink/65'
                  }`}
                >
                  {service.description}
                </p>

                <div className="mb-6 flex items-baseline gap-1.5">
                  <span className="font-display text-[56px] font-extrabold leading-none tracking-[-0.04em] md:text-[72px]">
                    {service.amountCents / 100}
                  </span>
                  <span className="font-display text-[24px] font-semibold md:text-[28px]">
                    €
                  </span>
                  <span
                    className={`ml-1 font-mono text-[11px] uppercase tracking-[0.05em] ${
                      featured ? 'text-white/55' : 'text-ink/50'
                    }`}
                  >
                    TTC
                  </span>
                </div>

                <div
                  className="mb-6 h-px w-full"
                  style={{
                    background: featured ? 'rgba(255,255,255,0.12)' : 'rgba(10,28,92,0.08)',
                  }}
                />

                <ul className="mb-7 flex list-none flex-col gap-2.5 p-0 text-[13px] md:text-sm">
                  {service.features.map((f) => (
                    <li key={f} className="flex items-center gap-3">
                      <span
                        aria-hidden
                        className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                          featured ? 'bg-blue-electric text-white' : 'bg-blue-wash text-blue'
                        }`}
                      >
                        ✓
                      </span>
                      <span className={featured ? 'text-white/85' : 'text-ink/80'}>
                        {f}
                      </span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={`/reserver?service=${service.id}`}
                  className={`mt-auto block w-full rounded-[10px] px-5 py-3.5 text-center font-cinsans text-[13px] font-semibold transition-transform hover:-translate-y-0.5 md:text-sm ${
                    featured
                      ? 'bg-blue-electric text-white'
                      : 'bg-ink text-white'
                  }`}
                >
                  Réserver
                </Link>
              </article>
            )
          })}
        </div>

        <p className="mt-10 text-center font-mono text-[11px] uppercase tracking-[0.08em] text-ink/55 md:mt-12 md:text-xs">
          Sans eau · Débit à l’acceptation du laveur · Annulation gratuite jusqu’à 24h avant
        </p>
      </div>
    </section>
  )
}
