import Link from 'next/link'

type Plan = {
  id: string
  name: string
  price: string
  dur: string
  feats: string[]
  featured?: boolean
}

const plans: Plan[] = [
  {
    id: 'lavage-exterieur',
    name: 'Extérieur',
    price: '29',
    dur: '30 min',
    feats: ['Carrosserie', 'Jantes & pneus', 'Vitres extérieures', 'Séchage microfibre'],
  },
  {
    id: 'lavage-complet',
    name: 'Complet',
    price: '59',
    dur: '60 min',
    feats: ['Lavage extérieur intégral', 'Aspiration habitacle', 'Plastiques & vitres', 'Brillant pneus'],
    featured: true,
  },
  {
    id: 'lavage-premium',
    name: 'Premium',
    price: '89',
    dur: '90 min',
    feats: ['Lavage complet', 'Cire lustrante', 'Soin cuirs / tissus', 'Désinfection complète'],
  },
]

export default function PricingCinetique() {
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
          {plans.map((p) => {
            const featured = !!p.featured
            return (
              <div
                key={p.id}
                className={`relative rounded-[20px] p-6 md:p-8 ${
                  featured
                    ? 'bg-ink text-white shadow-cin-feature md:-translate-y-3'
                    : 'bg-white text-ink shadow-cin-card'
                }`}
              >
                {featured && (
                  <div className="absolute right-4 top-4 rounded-full bg-blue-electric px-2.5 py-1 font-mono text-[10px] font-semibold tracking-[0.05em] text-white md:text-[11px]">
                    POPULAIRE
                  </div>
                )}
                <div
                  className={`mb-3 font-mono text-[11px] tracking-[0.05em] md:text-xs ${
                    featured ? 'text-blue-electric' : 'text-blue'
                  }`}
                >
                  {p.dur}
                </div>
                <h3 className="m-0 mb-5 font-display text-[26px] font-bold tracking-[-0.03em] md:text-[36px]">
                  {p.name}
                </h3>
                <div className="mb-5 flex items-baseline gap-1 md:mb-6">
                  <span className="font-display text-[48px] font-extrabold leading-none tracking-[-0.04em] md:text-[72px]">
                    {p.price}
                  </span>
                  <span className="font-display text-[22px] font-semibold md:text-[28px]">
                    €
                  </span>
                </div>
                <ul className="mb-6 flex list-none flex-col gap-2.5 p-0 text-[13px] md:mb-7 md:text-sm">
                  {p.feats.map((f) => (
                    <li key={f} className="flex items-center gap-3">
                      <span
                        className={`flex h-[18px] w-[18px] items-center justify-center rounded-full text-[11px] font-bold ${
                          featured
                            ? 'bg-blue text-white'
                            : 'bg-blue-wash text-blue'
                        }`}
                      >
                        ✓
                      </span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={`/reserver?service=${p.id}`}
                  className={`block w-full rounded-[10px] px-5 py-3.5 text-center font-cinsans text-[13px] font-semibold text-white transition-transform hover:-translate-y-0.5 md:text-sm ${
                    featured ? 'bg-blue-electric' : 'bg-ink'
                  }`}
                >
                  Réserver
                </Link>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
